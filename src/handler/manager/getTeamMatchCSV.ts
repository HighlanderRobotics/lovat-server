import { Request, Response } from "express";
import prismaClient from "../../prismaClient"
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";
import { stringify } from 'csv-stringify/sync';
import { UserRole, RobotRole, StageResult, HighNoteResult, PickUp, EventAction, Position, MatchType } from "@prisma/client";
import { autoEnd } from "../analysis/analysisConstants";
import { z } from "zod";

type AggregatedTeamMatchData = {
    match: string
    teamNumber: number
    role: string
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
    stage: string
    highNoteSuccess: boolean
    scouters: string
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
    scouter: {
        sourceTeamNumber: number
        name: string
    }
}

// Map of stage events to points given
const stagePointMap = {
    ONSTAGE_HARMONY: 5,
    ONSTAGE: 3,
    PARK: 1,
    NOTHING: 0
}

/**
 * Sends csv file of rows of AggregatedTeamMatchData instances, organized by match.
 * Uses data from queried tournament and user's teamSource. Available to Scouting Leads.
 * Non-averaged results default to highest report, except in the case of robot roles (to coincide with getTeamCSV).
 */
export const getTeamMatchCSV = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (req.user.role !== UserRole.SCOUTING_LEAD) {
            res.status(403).send("Not authorized to download scouting data");
            return;
        }

        // Source data from queried tournament
        const params = z.object({
            tournamentKey: z.string(),
        }).safeParse({
            tournamentKey: req.query.tournamentKey,
        });

        if (!params.success) {
            res.status(400).send({ "error": params, "displayError": "Invalid tournament selected." });
            return;
        }

        // Select instances of TeamMatchData with unique combinations of team and match
        // These instances will be sorted by team and match and then looped through and aggregated
        const datapoints = await prismaClient.teamMatchData.findMany({
            where: {
                tournamentKey: params.data.tournamentKey
            },
            select: {
                matchType: true,
                matchNumber: true,
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
                        scouter: {
                            select: {
                                sourceTeamNumber: true,
                                name: true
                            }
                        },
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
            orderBy: [
                {matchType: "desc"},
                {matchNumber: "asc"},
                {teamNumber: "asc"}
            ]
        });

        if (datapoints.length === 0) {
            res.status(400).send("Not enough scouting data from provided sources");
            return;
        }

        // Group reports by match type, match number, and team number (match first to reduce the size of recursive arrays)
        const groupedByMatch = datapoints.reduce<Record<string, PointsReport[][][]>>((acc, cur) => {
            acc[cur.matchType] ||= []

            acc[cur.matchType][cur.matchNumber] ||= [];

            acc[cur.matchType][cur.matchNumber][cur.teamNumber] = cur.scoutReports;

            return acc;
        }, {});

        // Here comes the mouthful
        const aggregatedData: AggregatedTeamMatchData[] = [];
        for (const [matchType, i] of Object.entries(groupedByMatch)) {
            i.forEach((j, matchNumber) => {
                j.forEach((reports, teamNumber) => {
                    const match = matchType.at(0) + matchNumber;
                    if (reports.length !== 0) {
                        // Append names of scouters from the same team as the user
                        const scouterNames = reports.filter(e => e.scouter.sourceTeamNumber === req.user.teamNumber).map(e => e.scouter.name);
                        aggregatedData.push(aggregateTeamMatchReports(match, teamNumber, reports, scouterNames));
                    } else {
                        // Push empty row if there are no reports available
                        // @ts-expect-error
                        aggregatedData.push({
                            match: match,
                            teamNumber: teamNumber
                        });
                    }
                })
            });
        }

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

function aggregateTeamMatchReports(match: string, teamNumber: number, reports: Omit<PointsReport, "scouter">[], scouters: string[]): AggregatedTeamMatchData {
    const data: AggregatedTeamMatchData = {
        match: match,
        teamNumber: teamNumber,
        role: null,
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
        stage: null,
        highNoteSuccess: false,
        scouters: scouters.join(",")
    }

    const roleCount: Record<RobotRole, number> = {
        OFFENSE: 0,
        DEFENSE: 0,
        FEEDER: 0,
        IMMOBILE: 0
    };

    const stageCount: Record<StageResult, number> = {
        ONSTAGE_HARMONY: 0,
        ONSTAGE: 0,
        PARK: 0,
        NOTHING: 0
    }

    reports.forEach(report => {
        data.avgDriverAbility += report.driverAbility;
        roleCount[report.robotRole]++;
        stageCount[report.stage]++;

        // Set if chute/groud pickup and high note scoring has been observed
        data.chutePickup ||= report.pickUp !== PickUp.GROUND;
        data.groundPickup ||= report.pickUp !== PickUp.CHUTE;
        data.highNoteSuccess ||= report.highNote == HighNoteResult.SUCCESSFUL;

        // Sum match points and actions
        report.events.forEach(event => {
            if (event.time < autoEnd) {
                data.avgAutoPoints += event.points;
            } else {
                data.avgTeleopPoints += event.points;
            }

            switch (event.action) {
                case EventAction.DEFENSE:
                    data.avgDefense++;
                    break;
                case EventAction.DROP_RING:
                    data.avgDrops++;
                    break;
                case EventAction.FEED_RING:
                    data.avgFeeds++;
                    break;
                case EventAction.PICK_UP:
                    data.avgPickups++;
                    break;
                case EventAction.SCORE:
                    data.avgScores++;
                    switch (event.position) {
                        case Position.AMP:
                            data.avgAmpScores++;
                            break;
                        case Position.SPEAKER:
                            data.avgSpeakerScores++;
                            break;
                        case Position.TRAP:
                            data.avgTrapScores++;
                            break;
                    }
                    break;
            }
        });
    })

    // Find highest-reported robot role and stage interaction
    Object.entries(roleCount).reduce((highest, role) => {
        // Using >= gives precedence to lower-frequency roles such as Feeder
        if (role[1] >= highest) {
            highest = role[1];
            data.role = role[0];
        }
        return highest;
    }, 0);

    Object.entries(stageCount).reduce((highest, stage) => {
        // Using > gives precedence to highest report
        if (stage[1] > highest) {
            highest = stage[1];
            data.stage = stage[0];
        }
        return highest;
    }, 0);

    // Add stage points to teleop
    data.avgTeleopPoints += stagePointMap[data.stage];

    // Divide relevent sums by number of matches to get mean
    data.avgTeleopPoints = roundToHundredth(data.avgTeleopPoints / reports.length);
    data.avgAutoPoints = roundToHundredth(data.avgAutoPoints / reports.length);
    data.avgDriverAbility = roundToHundredth(data.avgDriverAbility / reports.length);
    data.avgPickups = roundToHundredth(data.avgPickups / reports.length);
    data.avgFeeds = roundToHundredth(data.avgFeeds / reports.length);
    data.avgDrops = roundToHundredth(data.avgDrops / reports.length);
    data.avgScores = roundToHundredth(data.avgScores / reports.length);
    data.avgAmpScores = roundToHundredth(data.avgAmpScores / reports.length);
    data.avgSpeakerScores = roundToHundredth(data.avgSpeakerScores / reports.length);
    data.avgTrapScores = roundToHundredth(data.avgTrapScores / reports.length);
    data.avgDefense = roundToHundredth(data.avgDefense / reports.length);

    return data;
}

function roundToHundredth(a: number): number {
    return Math.round(a * 100) / 100;
}