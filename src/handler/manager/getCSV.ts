import { Response } from "express";
import prismaClient from "../../prismaClient"
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";
import { stringify } from 'csv-stringify/sync';
import { UserRole, RobotRole, StageResult, HighNoteResult, PickUp, EventAction } from "@prisma/client";
import { autoEnd } from "../analysis/analysisConstants";

type CSVData = {
    teamNumber: number
    avgTeleopPoints: number
    avgAutoPoints: number
    mainRole: string
    secondaryRole: string
    matchesImmobile: number
    avgDriverAbility: number
    stagePark: number
    stageClimb: number
    stageClimbHarmony: number
    groundPickup: boolean
    chutePickup: boolean
    highNoteFail: number
    highNoteSuccess: number
    // avgOffensePoints: number
    numMatches: number
    numReports: number
}

// Simplified scouting report containing only the properties required for aggregation
type PointsReport = {
    robotRole: RobotRole
    stage: StageResult
    highNote: HighNoteResult
    pickUp: PickUp
    driverAbility: number
    events: {
        time: number
        action: EventAction
        points: number
    }[]
    // This property represents the weighting of this report in the final aggregation [0..1]
    weight: number
}

export const getCSV = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (req.user.role !== UserRole.SCOUTING_LEAD) {
            res.status(403).send("Not authorized to download scouting data");
            return;
        }

        // TeamMatchData instances have unique combinations of team, match, and tournament keys
        // These instances will be sorted by team number and then looped through and aggregated
        const datapoints = await prismaClient.teamMatchData.findMany({
            where: {
                tournamentKey: {
                    in: req.user.tournamentSource
                }
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
                                points: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                teamNumber: "desc"
            }
        });

        if (datapoints.length === 0) {
            res.status(400).send("Not enough scouting data from provided sources");
            return;
        }

        // Group reports by team number in a sparse array
        const groupedByTeam = datapoints.reduce<{reports: PointsReport[], numMatches: number}[]>((acc, cur) => {
            acc[cur.teamNumber] = acc[cur.teamNumber] || {reports: [], numMatches: 0};

            // Increment number of matches for team
            acc[cur.teamNumber].numMatches++;

            // Push reports for team from match
            cur.scoutReports.forEach(element => {
                acc[cur.teamNumber].reports.push(Object.assign({weight: 1/cur.scoutReports.length}, element));
            });

            return acc;
        }, []);

        // Aggregate point values
        const aggregatedData: CSVData[] = [];
        groupedByTeam.forEach((group, teamNum) => {
            aggregatedData.push(aggregatePointsReports(teamNum, group.numMatches, group.reports));
        });

        // Create and send the csv string through express
        const csvString = stringify(aggregatedData, {
            header: true,
            // Creates csv headers from data properties
            columns: Object.keys(aggregatedData[0]),
            // Required for excel viewing
            bom: true
        });
        res.attachment("lovatDownload.csv");
        res.header('Content-Type', 'text/csv');
        res.send(csvString);
        return;

    } catch (error) {
        console.error(error)
        res.status(500).send(error)
    }
}

function aggregatePointsReports(teamNum: number, numMatches: number, reports: PointsReport[]): CSVData {
    let data: CSVData;
    data.teamNumber = teamNum;
    data.numMatches = numMatches;
    data.numReports = reports.length;

    // Main iteration for most aggregation summing
    const roles: Partial<Record<RobotRole, number>> = {};
    reports.forEach(report => {
        // Sum driver ability and robot role
        data.avgDriverAbility += report.driverAbility * report.weight;
        roles[report.robotRole] += report.weight;

        // Implement a safety for this? One incorrect report could mess up the data
        // Set if chute/groud pickup has been observed
        data.chutePickup ||= report.pickUp !== PickUp.GROUND;
        data.groundPickup ||= report.pickUp !== PickUp.CHUTE;

        // Sum high note successes/failures
        if (report.highNote === HighNoteResult.SUCCESSFUL) {
            data.highNoteSuccess += report.weight;
        } else if (report.highNote === HighNoteResult.FAILED) {
            data.highNoteFail += report.weight;
        }

        // Sum stage results
        switch (report.stage) {
            case StageResult.PARK:
                data.stagePark += report.weight;
            case StageResult.ONSTAGE:
                data.stageClimb += report.weight;
            case StageResult.ONSTAGE_HARMONY:
                data.stageClimbHarmony += report.weight;
        }

        // Sum match points
        report.events.forEach(event => {
            if (event.time < autoEnd) {
                data.avgAutoPoints += event.points * report.weight;
            } else {
                data.avgTeleopPoints += event.points * report.weight;
            }
            // FIX: This will only work if all reports for a match mark robot role as offense
            // if (report.robotRole === RobotRole.OFFENSE) {
            //     data.avgOffensePoints += event.points * report.weight;
            // }
            // data.avgOffensePoints = 0;
        });
    });

    data.matchesImmobile = roles.IMMOBILE;
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

    // Divide relevent sums by number of matches to get mean
    data.avgDriverAbility /= numMatches;
    data.avgAutoPoints /= numMatches;
    data.avgTeleopPoints /= numMatches;
    // data.avgOffensePoints /= numMatches;

    return data;
}