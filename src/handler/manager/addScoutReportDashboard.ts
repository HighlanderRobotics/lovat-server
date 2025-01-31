import { Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";
import { CoralPickupMap, AlgaePickupMap, PositionMap, MatchTypeMap, BargeResultMap, KnocksAlgaeMap, UnderShallowCageMap, RobotRoleMap, EventActionMap } from "./managerConstants";
import { addTournamentMatches } from "./addTournamentMatches";
import { totalPointsScoutingLead } from "../analysis/scoutingLead/totalPointsScoutingLead";


export const addScoutReportDashboard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {

    try {
        const paramsScoutReport = z.object({
            uuid: z.string(),
            startTime: z.number(),
            notes: z.string(),
            robotRole: z.enum(["OFFENSE", "DEFENSE", "FEEDER", "IMMOBILE"]),
            barge: z.enum(["NOT_ATTEMPTED", "PARKED", "SHALLOW", "FAILED_SHALLOW", "DEEP", "FAILED_DEEP"]),
            coralPickUp: z.enum(["NONE", "GROUND", "STATION", "BOTH"]),
            algaePickUp: z.enum(["NONE", "GROUND", "REEF", "BOTH"]),
            knocksAlgae: z.enum(["TRUE", "FALSE"]),
            traversesUnderCage: z.enum(["TRUE", "FALSE"]),
            driverAbility: z.number(),
            scouterUuid: z.string(),
            matchType: z.enum(["QUALIFICATION", "ELIMINATION"]),
            matchNumber: z.number(),
            tournamentKey: z.string(),
            teamNumber: z.number()
        }).safeParse({
            uuid: req.body.uuid,
            scouterUuid: req.body.scouterUuid,
            startTime: req.body.startTime,
            notes: req.body.notes,
            robotRole: RobotRoleMap[req.body.robotRole][0],
            driverAbility: req.body.driverAbility,
            barge: BargeResultMap[req.body.barge][0],
            algaePickUp: AlgaePickupMap[req.body.algaePickUp][0],
            coralPickUp: CoralPickupMap[req.body.coralPickUp][0],
            knocksAlgae: KnocksAlgaeMap[req.body.knocksAlgae][0],
            traversesUnderCage: UnderShallowCageMap[req.body.traversesUnderCage][0],
            matchType: MatchTypeMap[req.body.matchType][0],
            matchNumber: req.body.matchNumber,
            teamNumber: req.body.teamNumber,
            tournamentKey: req.body.tournamentKey
        })
        if (!paramsScoutReport.success) {
            res.status(400).send({ "error": paramsScoutReport, "displayError": "Invalid input. Make sure you are using the correct input." });
            return;
        };
        const scouter = await prismaClient.scouter.findUnique({
            where:
            {
                uuid: paramsScoutReport.data.scouterUuid
            }
        })
        if (!scouter) {
            res.status(400).send({ "error": `This ${paramsScoutReport.data.scouterUuid} has been deleted or never existed.`, "displayError": "This scouter has been deleted. Have the scouter reset their settings and choose a new scouter." })
            return
        }
        if (req.user.teamNumber === null || scouter.sourceTeamNumber !== req.user.teamNumber) {
            res.status(401).send({ error: `User with the id ${req.user.id} is not on the same team as the scouter with the uuid ${scouter.uuid}`, displayError: "Not on the same team as the scouter." })
            return
        }
        const scoutReportUuidRow = await prismaClient.scoutReport.findUnique({
            where:
            {
                uuid: paramsScoutReport.data.uuid
            }
        })
        if (scoutReportUuidRow) {
            res.status(400).send({ "error": `The scout report uuid ${paramsScoutReport.data.uuid} already exists.`, "displayError": "Scout report already uploaded" })
            return
        }


        const tournamentMatchRows = await prismaClient.teamMatchData.findMany({
            where:
            {
                tournamentKey: paramsScoutReport.data.tournamentKey
            }
        })
        if (tournamentMatchRows === null || tournamentMatchRows.length === 0) {
            await addTournamentMatches(paramsScoutReport.data.tournamentKey)
        }
        const matchRow = await prismaClient.teamMatchData.findFirst({
            where:
            {
                tournamentKey: paramsScoutReport.data.tournamentKey,
                matchNumber: paramsScoutReport.data.matchNumber,
                matchType: paramsScoutReport.data.matchType,
                teamNumber: paramsScoutReport.data.teamNumber
            }
        })
        if (!matchRow) {
            res.status(404).send({ "error": `There are no matches that meet these requirements. ${paramsScoutReport.data.tournamentKey}, ${paramsScoutReport.data.matchNumber}, ${paramsScoutReport.data.matchType}, ${paramsScoutReport.data.teamNumber}`, "displayError": "Match does not exist" })
            return
        }
        const matchKey = matchRow.key

        const row = await prismaClient.scoutReport.create(
            {
                data: {
                    //constants
                    uuid: paramsScoutReport.data.uuid,
                    teamMatchKey: matchKey,
                    startTime: new Date(paramsScoutReport.data.startTime),
                    scouterUuid: paramsScoutReport.data.scouterUuid,
                    notes: paramsScoutReport.data.notes,
                    robotRole: paramsScoutReport.data.robotRole,
                    driverAbility: paramsScoutReport.data.driverAbility,
                    //game specfific
                    bargeResult: paramsScoutReport.data.barge,
                    algaePickup: paramsScoutReport.data.algaePickUp,
                    coralPickup: paramsScoutReport.data.coralPickUp,
                    UnderShallowCage: paramsScoutReport.data.traversesUnderCage,
                    KnocksAlgae: paramsScoutReport.data.knocksAlgae
                }
            }
        )
        const scoutReportUuid = row.uuid
        const eventDataArray = []
        const events = req.body.events;
        let ampOn = false
        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let i = 0; i < events.length; i++) {
            let points = 0;
            const time = events[i][0];
            const position = PositionMap[events[i][2]][0];
            const action = EventActionMap[events[i][1]][0];
            if (time <= 18) {
                if (action === "SCORE_CORAL") {
                    if (position === "LEVEL_ONE_A" || position === "LEVEL_ONE_B" || position === "LEVEL_ONE_C") {
                        points = 3
                    }
                    else if (position === "LEVEL_TWO_A" || position === "LEVEL_TWO_B" || position === "LEVEL_TWO_C") {
                        points = 4
                    }
                    else if (position === "LEVEL_THREE_A" || position === "LEVEL_THREE_B" || position === "LEVEL_THREE_C") {
                        points = 6
                    }
                    else if (position === "LEVEL_FOUR_A" || position === "LEVEL_FOUR_B" || position === "LEVEL_FOUR_C") {
                        points = 7
                    }
                }
                else if (action === "AUTO_LEAVE") {
                    points = 3
                }
                else if (action === "SCORE_PROCESSOR") {
                    points = 6
                }
                else if (action === "SCORE_NET") {
                    points = 4
                }
            }
            else {
                if (action === "SCORE_CORAL") {
                    if (position === "LEVEL_ONE") {
                        points = 2
                    }
                    else if (position === "LEVEL_TWO") {
                        points = 3
                    }
                    else if (position === "LEVEL_THREE") {
                        points = 4
                    }
                    else if (position === "LEVEL_FOUR") {
                        points = 5
                    }
                }
                else if (action === "SCORE_PROCESSOR") {
                    points = 6
                }
                else if (action === "SCORE_NET") {
                    points = 4
                }
            }
            const paramsEvents = z.object({
                time: z.number(),
                action: z.enum(["PICKUP_CORAL", "PICKUP_ALGAE", "FEED", "AUTO_LEAVE", "DEFEND", "SCORE_NET", "FAIL_NET", "SCORE_PROCESSOR", "SCORE_CORAL", "DROP_ALGAE", "DROP_CORAL", "START_POSITION"]),
                position: z.enum(["NONE", "START_ONE", "START_TWO", "START_THREE", "START_FOUR", "LEVEL_ONE", "LEVEL_TWO", "LEVEL_THREE", "LEVEL_FOUR", "LEVEL_ONE_A", "LEVEL_ONE_B", "LEVEL_ONE_C", "LEVEL_TWO_A", "LEVEL_TWO_B", "LEVEL_TWO_C", "LEVEL_THREE_A", "LEVEL_THREE_B", "LEVEL_THREE_C", "LEVEL_FOUR_A", "LEVEL_FOUR_B", "LEVEL_FOUR_C", "GROUND_PIECE_A", "GROUND_PIECE_B", "GROUND_PIECE_C", "CORAL_STATION_ONE", "CORAL_STATION_TWO"]),
                points: z.number(),
                scoutReportUuid: z.string()
            }).safeParse({
                scoutReportUuid: scoutReportUuid,
                time: time,
                action: action,
                position: position,
                points: points
            })
            if (!paramsEvents.success) {
                res.status(400).send({ "error": paramsEvents, "displayError": "Invalid input. Make sure you are using the correct input." });
                return;
            };
            eventDataArray.push({
                time: paramsEvents.data.time,
                action: paramsEvents.data.action,
                position: paramsEvents.data.position,
                points: paramsEvents.data.points,
                scoutReportUuid: scoutReportUuid
            })

        }
        await prismaClient.event.createMany({
            data: eventDataArray
        })
        await totalPointsScoutingLead(scoutReportUuid)
        //recalibrate the max resonable points for every year 
        //uncomment for scouting lead page
        // if (totalPoints === 0 || totalPoints > 80) {
        //     await prismaClient.flaggedScoutReport.create({
        //         data:
        //         {
        //             note: `${totalPoints} recorded, not including endgame`,
        //             scoutReportUuid: scoutReportUuid
        //         }

        //     })
        // }
        res.status(200).send('done adding data');
    }

    catch (error) {
        console.log(error)
        res.status(500).send({ "error": error, "displayError": "Error" });

    }
}


