import { Request, Response } from "express";
import prismaClient from "../../prismaClient"
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";
import { stringify } from "csv-stringify/sync";
import { UserRole, HighNoteResult, PickUp, EventAction, Position } from "@prisma/client";
import { autoEnd } from "../analysis/analysisConstants";
import { z } from "zod";

// Scouting report condensed into a single dimension that can be pushed to a row in the csv
class CondensedReport {
    match: string
    teamNumber: number
    role: string
    groundPickup: boolean
    chutePickup: boolean
    teleopPoints: number
    autoPoints: number
    driverAbility: number
    pickups: number
    feeds: number
    drops: number
    scores: number
    ampScores: number
    speakerScores: number
    trapScores: number
    defense: number
    stage: string
    highNoteSuccess: boolean
    scouter: string
    notes: string
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
 * Uses data from queried tournament and user"s teamSource. Available to Scouting Leads.
 * Non-averaged results default to highest report, except in the case of robot roles (to coincide with getTeamCSV).
 */
export const getReportCSV = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

        // Select scout reports from the given tournament and team sources
        // These instances will be looped through and remade into rows of the csv
        const datapoints = await prismaClient.scoutReport.findMany({
            where: {
                teamMatchData: {
                    tournamentKey: params.data.tournamentKey
                },
                scouter: {
                    sourceTeamNumber: {
                        in: req.user.teamSource
                    }
                }
            },
            select: {
                notes: true,
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
                },
                scouter: {
                    select: {
                        sourceTeamNumber: true,
                        name: true
                    }
                },
                teamMatchData: {
                    select: {
                        teamNumber: true,
                        matchNumber: true,
                        matchType: true
                    }
                }
            },
            orderBy: [
                {teamMatchData: {matchType: "desc"}},
                {teamMatchData: {matchNumber: "asc"}},
                {teamMatchData: {teamNumber: "asc"}}
            ]
        })

        if (datapoints.length === 0) {
            res.status(400).send("Not enough scouting data from provided sources");
            return;
        }

        const condensed = datapoints.map(r => condenseReport(r, req.user.teamNumber));

        // Create and send the csv string through express
        const csvString = stringify(condensed, {
            header: true,
            // Creates column headers from data properties
            columns: Object.keys(condensed[0]),
            // Required for excel viewing
            bom: true,
            // Rename boolean values to TRUE and FALSE
            cast: {
                boolean: b => b ? "TRUE" : "FALSE"
            },
            // Turn off quotation marks
            quote: false
        });

        res.attachment("lovatReportsDownload.csv");
        res.header("Content-Type", "text/csv");
        res.send(csvString);
        return;

    } catch (error) {
        console.error(error)
        res.status(500).send(error)
    }
}

function condenseReport(report, userTeam: number): CondensedReport {
    const data: CondensedReport = {
        match: report.teamMatchData.matchType.at(0) + report.teamMatchData.matchNumber,
        teamNumber: report.teamMatchData.teamNumber,
        role: report.robotRole,
        groundPickup: report.pickUp !== PickUp.CHUTE,
        chutePickup: report.pickUp !== PickUp.GROUND,
        teleopPoints: 0,
        autoPoints: 0,
        driverAbility: report.driverAbility,
        pickups: 0,
        feeds: 0,
        drops: 0,
        scores: 0,
        ampScores: 0,
        speakerScores: 0,
        trapScores: 0,
        defense: 0,
        stage: report.stage,
        highNoteSuccess: report.highNote === HighNoteResult.SUCCESSFUL,
        scouter: "",
        notes: report.notes.replace(/,/g, ";", ) // Avoid commas in a csv...
    };

    // Sum match points and actions
    report.events.forEach(event => {
        if (event.time < autoEnd) {
            data.autoPoints += event.points;
        } else {
            data.teleopPoints += event.points
        }

        switch (event.action) {
            case EventAction.DEFENSE:
                data.defense++;
                break;
            case EventAction.DROP_RING:
                data.drops++;
                break;
            case EventAction.FEED_RING:
                data.feeds++;
                break;
            case EventAction.PICK_UP:
                data.pickups++;
                break;
            case EventAction.SCORE:
                data.scores++;
                switch (event.position) {
                    case Position.AMP:
                        data.ampScores++;
                        break;
                    case Position.SPEAKER:
                        data.speakerScores++;
                        break;
                    case Position.TRAP:
                        data.trapScores++;
                        break;
                }
                break;
        }
    });

    // Add stage points to teleop
    data.teleopPoints += stagePointMap[data.stage];

    if (report.scouter.sourceTeamNumber === userTeam) {
        data.scouter = report.scouter.name;
    } else {
        data.scouter = "";
    }

    return data;
}