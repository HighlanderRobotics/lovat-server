import { Response } from "express";
import prismaClient from "../../prismaClient"
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";
import { stringify } from 'csv-stringify/sync';
import { UserRole, RobotRole, StageResult, HighNoteResult, PickUp, EventAction, Position } from "@prisma/client";
import { autoEnd } from "../analysis/analysisConstants";
import { z } from "zod";

type AggregatedTeamData = {
    teamNumber: number
    mainRole: string
    secondaryRole: string
    groundPickup: boolean
    chutePickup: boolean
    avgTeleopPoints: number
    avgAutoPoints: number
    avgDriverAbility: number
    avgPickups: number
    avgFeeds: number
    avgDrops: number
    avgScores: number
    avgAmpScores: number
    avgSpeakerScores: number
    avgTrapScores: number
    avgDefense: number
    // avgOffensePoints: number
    percStagePark: number
    percStageClimb: number
    percStageClimbHarmony: number
    percStageNone: number
    highNoteFails: number
    highNoteSuccesses: number
    matchesImmobile: number
    numMatches: number
    numReports: number
}

// Simplified scouting report with properties required for aggregation
type PointsReport = {
    robotRole: RobotRole
    stage: StageResult
    highNote: HighNoteResult
    pickUp: PickUp
    driverAbility: number
    events: {
        time: number
        action: EventAction
        position: Position
        points: number
    }[]
    // This property represents the weighting of this report in the final aggregation [0..1]
    weight: number
}

/**
 * Sends csv file of rows of AggregatedTeamData instances, organized by team.
 * Uses data from queried tournament and user's teamSource. Available to Scouting Leads.
 */
export const getTeamCSV = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (req.user.role !== UserRole.SCOUTING_LEAD) {
            res.status(403).send("Not authorized to download scouting data");
            return;
        }

        // Data will only be sourced from a tournament as sent with the request
        const params = z.object({
            tournamentKey: z.string()
        }).safeParse({
            tournamentKey: req.query.tournamentKey
        });

        if (!params.success) {
            res.status(400).send({ "error": params, "displayError": "Invalid tournament selected." });
            return;
        }

        // TeamMatchData instances have unique combinations of team, match, and tournament keys
        // These instances will be sorted by team number and then looped through and aggregated
        const datapoints = await prismaClient.teamMatchData.findMany({
            where: {
                tournamentKey: params.data.tournamentKey
            },
            select: {
                teamNumber: true,
                scoutReports: {
                    where: {
                        scouter: {
                            sourceTeamNumber: {
                                in: req.user.teamSource
                            }
                        }
                    },
                    select: {
                        robotRole: true,
                        stage: true,
                        highNote: true,
                        pickUp: true,
                        driverAbility: true,
                        events: {
                            select: {
                                time: true,
                                action: true,
                                position: true,
                                points: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                teamNumber: "asc"
            }
        });

        if (datapoints.length === 0) {
            res.status(400).send("Not enough scouting data from provided sources");
            return;
        }

        // Group reports by team number in a sparse array
        const groupedByTeam = datapoints.reduce<{reports: PointsReport[], numMatches: number}[]>((acc, cur) => {
            acc[cur.teamNumber] ||= {reports: [], numMatches: 0};

            // Increment number of matches for team
            acc[cur.teamNumber].numMatches++;

            // Push reports for team from match
            cur.scoutReports.forEach(element => {
                acc[cur.teamNumber].reports.push(Object.assign({weight: 1/cur.scoutReports.length}, element));
            });

            return acc;
        }, []);

        // Aggregate point values
        const aggregatedData: AggregatedTeamData[] = [];
        groupedByTeam.forEach((group, teamNum) => {
            aggregatedData.push(aggregateTeamReports(teamNum, group.numMatches, group.reports));
        });

        // Create and send the csv string through express
        const csvString = stringify(aggregatedData, {
            header: true,
            // Creates column headers from data properties
            columns: Object.keys(aggregatedData[0]),
            // Required for excel viewing
            bom: true,
            // Rename boolean values to TRUE and FALSE
            cast: {
                boolean: b => b ? "TRUE" : "FALSE"
            },
            // Turn off quotation marks
            quote: false
        });

        res.attachment("teamDataDownload.csv");
        res.header('Content-Type', 'text/csv');
        res.send(csvString);
        return;

    } catch (error) {
        console.error(error)
        res.status(500).send(error)
    }
}

function aggregateTeamReports(teamNum: number, numMatches: number, reports: PointsReport[]): AggregatedTeamData {
    const data: AggregatedTeamData = {
        teamNumber: teamNum,
        mainRole: null,
        secondaryRole: null,
        groundPickup: false,
        chutePickup: false,
        avgTeleopPoints: 0,
        avgAutoPoints: 0,
        avgDriverAbility: 0,
        avgPickups: 0,
        avgFeeds: 0,
        avgDrops: 0,
        avgScores: 0,
        avgAmpScores: 0,
        avgSpeakerScores: 0,
        avgTrapScores: 0,
        avgDefense: 0,
        percStagePark: 0,
        percStageClimb: 0,
        percStageClimbHarmony: 0,
        percStageNone : 0,
        highNoteFails: 0,
        highNoteSuccesses: 0,
        matchesImmobile: 0,
        numMatches: numMatches,
        numReports: reports.length
    };

    const roles: Record<RobotRole, number> = {
        OFFENSE: 0,
        DEFENSE: 0,
        FEEDER: 0,
        IMMOBILE: 0
    };
    // Main iteration for most aggregation summing
    reports.forEach(report => {
        // Sum driver ability and robot role
        data.avgDriverAbility += report.driverAbility * report.weight;
        roles[report.robotRole] += report.weight;

        // Implement a safety for this? One incorrect report could mess up the data
        // Set if chute/groud pickup has been observed
        data.chutePickup ||= report.pickUp !== PickUp.GROUND;
        data.groundPickup ||= report.pickUp !== PickUp.CHUTE;

        // Sum stage results
        switch (report.stage) {
            case StageResult.PARK:
                data.percStagePark += report.weight;
                break;
            case StageResult.ONSTAGE:
                data.percStageClimb += report.weight;
                break;
            case StageResult.ONSTAGE_HARMONY:
                data.percStageClimbHarmony += report.weight;
                break;
            case StageResult.NOTHING:
                data.percStageNone += report.weight;
                break;
        }

        // Sum high note successes/failures
        if (report.highNote === HighNoteResult.SUCCESSFUL) {
            data.highNoteSuccesses += report.weight;
        } else if (report.highNote === HighNoteResult.FAILED) {
            data.highNoteFails += report.weight;
        }

        // Sum match points and actions
        report.events.forEach(event => {
            if (event.time < autoEnd) {
                data.avgAutoPoints += event.points * report.weight;
            } else {
                data.avgTeleopPoints += event.points * report.weight;
            }

            switch (event.action) {
                case EventAction.DEFENSE:
                    data.avgDefense += report.weight;
                    break;
                case EventAction.DROP_RING:
                    data.avgDrops += report.weight;
                    break;
                case EventAction.FEED_RING:
                    data.avgFeeds += report.weight;
                    break;
                case EventAction.PICK_UP:
                    data.avgPickups += report.weight;
                    break;
                case EventAction.SCORE:
                    data.avgScores += report.weight;
                    switch (event.position) {
                        case Position.AMP:
                            data.avgAmpScores += report.weight;
                            break;
                        case Position.SPEAKER:
                            data.avgSpeakerScores += report.weight;
                            break;
                        case Position.TRAP:
                            data.avgTrapScores += report.weight;
                            break;
                    }
                    break;
            }

            // FIX: This will only work if all reports for a match mark robot role as offense
            // if (report.robotRole === RobotRole.OFFENSE) {
            //     data.avgOffensePoints += event.points * report.weight;
            // }
        });
    });

    data.matchesImmobile = roles.IMMOBILE || 0;
    // Remove IMMOBILE state from main roles
    delete roles.IMMOBILE;

    // Main method to find highest reported roles
    const highestOccurences = Object.entries(roles).reduce((highestOccurences, role) => {
        // Using >= gives precedence to lower-frequency roles such as Feeder
        if (role[1] >= highestOccurences[1]) {
            if (role[1] >= highestOccurences[0]) {
                // Push main role to secondary
                highestOccurences[1] = highestOccurences[0];
                data.secondaryRole = data.mainRole;

                // Push new role to main
                highestOccurences[0] = role[1];
                data.mainRole = role[0];
            } else {
                // Push new role to secondary
                highestOccurences[1] = role[1];
                data.secondaryRole = role[0];
            }
        }

        return highestOccurences;
    }, [0, 0]);

    // Failsafe if robot lacks reports for enough roles
    if (highestOccurences[1] === 0) {
        data.secondaryRole = "NONE"
        if (highestOccurences[0] === 0) {
            data.mainRole = RobotRole.IMMOBILE;
        }
    }

    // Add stage points to teleop
    data.avgTeleopPoints += data.percStagePark + data.percStageClimb * 3 + data.percStageClimbHarmony * 5;

    // Divide relevent sums by number of matches to get mean
    data.avgTeleopPoints = roundToHundredth(data.avgTeleopPoints / numMatches);
    data.avgAutoPoints = roundToHundredth(data.avgAutoPoints / numMatches);
    data.avgDriverAbility = roundToHundredth(data.avgDriverAbility / numMatches);
    data.avgPickups = roundToHundredth(data.avgPickups / numMatches);
    data.avgFeeds = roundToHundredth(data.avgFeeds / numMatches);
    data.avgDrops = roundToHundredth(data.avgDrops / numMatches);
    data.avgScores = roundToHundredth(data.avgScores / numMatches);
    data.avgAmpScores = roundToHundredth(data.avgAmpScores / numMatches);
    data.avgSpeakerScores = roundToHundredth(data.avgSpeakerScores / numMatches);
    data.avgTrapScores = roundToHundredth(data.avgTrapScores / numMatches);
    data.avgDefense = roundToHundredth(data.avgDefense / numMatches);
    // data.avgOffensePoints = roundToHundredth(data.avgOffensePoints / numMatches);

    data.percStagePark = Math.round(data.percStagePark / numMatches * 1000) / 10;
    data.percStageClimb = Math.round(data.percStageClimb / numMatches * 1000) / 10;
    data.percStageClimbHarmony = Math.round(data.percStageClimbHarmony / numMatches * 1000) / 10;
    data.percStageNone = Math.round(data.percStageNone / numMatches * 1000) / 10;

    // Trim remaining datapoints
    data.highNoteFails = roundToHundredth(data.highNoteFails);
    data.highNoteSuccesses = roundToHundredth(data.highNoteSuccesses);
    data.matchesImmobile = roundToHundredth(data.matchesImmobile);

    return data;
}

function roundToHundredth(a: number): number {
    return Math.round(a * 100) / 100;
}