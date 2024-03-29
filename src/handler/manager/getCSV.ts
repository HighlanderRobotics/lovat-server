import { Response } from "express";
import prismaClient from "../../prismaClient"
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";
import { stringify } from 'csv-stringify/sync';
import { UserRole, RobotRole, StageResult, HighNoteResult, PickUp, EventAction } from "@prisma/client";

type CSVData = {
    teamNumber: number
    avgTeleopPoints: number
    avgAutoPoints: number
    avgOffensePoints: number
    mainRole: string
    secondaryRole: string
    matchesImmobile: number
    avgDriverAbility: number
    stagePark: number
    stageClimb: number
    stageClimbHarmony: number
    groundPickup: number
    chutePickup: number
    highNoteSuccess: number
    highNoteFail: number
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
    /** This property represents the weighting of this report in the final aggregation [0..1] */
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
        const groupedByTeam = datapoints.reduce<PointsReport[][]>((acc, cur) => {
            acc[cur.teamNumber] = acc[cur.teamNumber] || [];

            cur.scoutReports.forEach(element => {
                acc[cur.teamNumber].push(Object.assign({weight: 1/cur.scoutReports.length}, element));
            });

            return acc;
        }, []);

        // Aggregate point values
        const aggregatedData: CSVData[] = [];
        groupedByTeam.forEach((reports, teamNum) => {
            aggregatedData.push(Object.assign({teamNumber: teamNum}, aggregatePointsReports(reports)));
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

function aggregatePointsReports(reports: PointsReport[]): Omit<CSVData, "teamNumber"> {
    // Do the heavy lifting here :)
    return null;
}