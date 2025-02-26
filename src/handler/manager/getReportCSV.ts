import { Response } from "express";
import prismaClient from "../../prismaClient"
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";
import { stringify } from "csv-stringify/sync";
import { UserRole, EventAction, Position, UnderShallowCage, KnocksAlgae, BargeResult, RobotRole, AlgaePickup, CoralPickup, Scouter, TeamMatchData, Event } from "@prisma/client";
import { autoEnd, endgameToPoints, teleopStart } from "../analysis/analysisConstants";
import { z } from "zod";

// Scouting report condensed into a single dimension that can be pushed to a row in the csv
export interface CondensedReport {
    match: string
    teamNumber: number
    role: string
    coralPickup: string
    algaePickup: string
    algaeKnocking: boolean
    underShallowCage: boolean
    teleopPoints: number
    autoPoints: number
    driverAbility: number
    feeds: number
    defends: number
    coralPickups: number
    algaePickups: number
    coralDrops: number
    algaeDrops: number
    coralL1: number
    coralL2: number
    coralL3: number
    coralL4: number
    processorScores: number
    netScores: number
    netFails: number
    activeAuton: boolean
    endgame: string
    scouter: string
    notes: string
}

// Simplified scouting report with properties required for aggregation
interface PointsReport {
    notes: string
    robotRole: RobotRole
    algaePickup: AlgaePickup
    coralPickup: CoralPickup
    bargeResult: BargeResult
    knocksAlgae: KnocksAlgae
    underShallowCage: UnderShallowCage
    driverAbility: number
    events: Partial<Event>[]
    scouter: Partial<Scouter>
    teamMatchData: Partial<TeamMatchData>
}

/**
 * Sends csv file of rows of CondensedReport instances, representing a single scout report.
 * Uses data from queried tournament and user's teamSource. Available to Scouting Leads.
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

        // Note: passing neither value should act the same as passing both
        const auto = req.query.auto !== undefined;
        const teleop = req.query.teleop !== undefined;
        const includeAuto = auto || !(auto || teleop);
        const includeTeleop = teleop || !(auto || teleop);
        
        // Time filter for event counting
        let eventTimeFilter: { time: { lte?: number, gte?: number }} = undefined;
        if (includeAuto && !includeTeleop) {
            eventTimeFilter = {
                time: {
                    lte: autoEnd
                }
            }
        } else if (includeTeleop && !includeAuto) {
            eventTimeFilter = {
                time: {
                    gte: teleopStart
                }
            }
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
                algaePickup: true,
                coralPickup: true,
                bargeResult: true,
                knocksAlgae: true,
                underShallowCage: true,
                driverAbility: true,
                events: {
                    where: eventTimeFilter,
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
            // Ordering prioritizes top to bottom
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

        const condensed = datapoints.map(r => condenseReport(r, req.user.teamNumber, includeAuto, includeTeleop));

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

// Less verbose and don't want to create new arrays constantly
const posL1: Position[] = [Position.LEVEL_ONE_A, Position.LEVEL_ONE_B, Position.LEVEL_ONE_C];
const posL2: Position[] = [Position.LEVEL_TWO_A, Position.LEVEL_TWO_B, Position.LEVEL_TWO_C];
const posL3: Position[] = [Position.LEVEL_THREE_A, Position.LEVEL_THREE_B, Position.LEVEL_THREE_C];

function condenseReport(report: PointsReport, userTeam: number, includeAuto: boolean, includeTeleop: boolean): CondensedReport {
    const data: CondensedReport = {
        match: report.teamMatchData.matchType.at(0) + report.teamMatchData.matchNumber,
        teamNumber: report.teamMatchData.teamNumber,
        role: report.robotRole,
        coralPickup: report.coralPickup,
        algaePickup: report.algaePickup,
        algaeKnocking: report.knocksAlgae === KnocksAlgae.YES,
        underShallowCage: report.underShallowCage === UnderShallowCage.YES,
        teleopPoints: 0,
        autoPoints: 0,
        driverAbility: report.driverAbility,
        feeds: 0,
        defends: 0,
        coralPickups: 0,
        algaePickups: 0,
        coralDrops: 0,
        algaeDrops: 0,
        coralL1: 0,
        coralL2: 0,
        coralL3: 0,
        coralL4: 0,
        processorScores: 0,
        netScores: 0,
        netFails: 0,
        activeAuton: false,
        endgame: report.bargeResult,
        scouter: "",
        notes: report.notes.replace(/,/g, ";") // Avoid commas in a csv...
    };

    // Sum match points and actions
    report.events.forEach(event => {
        if (event.time <= autoEnd) {
            data.autoPoints += event.points;
        } else {
            data.teleopPoints += event.points
        }

        switch (event.action) {
            case EventAction.PICKUP_CORAL:
                data.coralPickups++;
                break;
            case EventAction.PICKUP_ALGAE:
                data.algaePickups++;
                break;
            case EventAction.FEED:
                data.feeds++;
                break;
            case EventAction.AUTO_LEAVE:
                data.activeAuton = true;
                break;
            case EventAction.DEFEND:
                data.defends++;
                break;
            case EventAction.SCORE_NET:
                data.netScores++;
                break;
            case EventAction.FAIL_NET:
                data.netFails++;
                break;
            case EventAction.SCORE_PROCESSOR:
                data.processorScores++;
                break;
            case EventAction.SCORE_CORAL:
                switch (event.position) {
                    case Position.LEVEL_ONE:
                        data.coralL1++;
                        break;
                    case Position.LEVEL_TWO:
                        data.coralL2++;
                        break;
                    case Position.LEVEL_THREE:
                        data.coralL3++;
                        break;
                    case Position.LEVEL_FOUR:
                        data.coralL4++;
                        break;
                    default:
                        // During auto
                        if (posL1.includes(event.position)) {
                            data.coralL1++;
                        } else if (posL2.includes(event.position)) {
                            data.coralL2++;
                        } else if (posL3.includes(event.position)) {
                            data.coralL3++;
                        } else {
                            data.coralL4++;
                        }
                        break;
                }
                break;
            case EventAction.DROP_ALGAE:
                data.algaeDrops++;
                break;
            case EventAction.DROP_CORAL:
                data.coralDrops++;
                break;
        }
    });

    // Add stage points to teleop
    if (includeTeleop) {
        data.teleopPoints += endgameToPoints[data.endgame as BargeResult];
    }

    if (report.scouter.sourceTeamNumber === userTeam) {
        data.scouter = report.scouter.name.replace(/,/g, ";"); // Avoid commas in a csv...
    }

    return data;
}