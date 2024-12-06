import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { PickUpMap, PositionMap, MatchTypeMap, EndChargingResultMap, AutoChargingResultMap, RobotRoleMap, EventActionMap} from "./managerConstants";
import { addTournamentMatches } from "./addTournamentMatches";
import { totalPointsScoutingLead } from "../analysis/scoutingLead/totalPointsScoutingLead";


export const addScoutReport = async (req: Request, res: Response): Promise<void> => {

    try {
        const paramsScoutReport = z.object({
            uuid : z.string(),
            startTime: z.number(),
            notes: z.string(),
            robotRole: z.enum(["OFFENSE", "DEFENSE", "IMMOBILE"]),
            pickUp: z.enum(["GROUND", "CHUTE", "SHELF"]),
            autoChargingResult: z.enum(["NOTHING", "FAILED", "TIPPED", "ENGAGED"]),
            endChargingResult: z.enum(["NOTHING", "FAILED", "TIPPED", "ENGAGED"]),
            driverAbility: z.number(),
            scouterUuid: z.string(),
            matchType : z.enum(["QUALIFICATION", "ELIMINATION"]),
            matchNumber : z.number(),
            tournamentKey : z.string(),
            teamNumber : z.number()
        }).safeParse({
            uuid : req.body.uuid,
            scouterUuid: req.body.scouterUuid,
            startTime: req.body.startTime,
            notes: req.body.notes,
            robotRole:  RobotRoleMap[req.body.robotRole][0],
            driverAbility:  req.body.driverAbility,
            autoChargingResult:  AutoChargingResultMap[req.body.AutoChargingResult][0],
            pickUp:  PickUpMap[req.body.pickUp][0],
            endChargingResult:  EndChargingResultMap[req.body.EndChargingResult][0],
            matchType : MatchTypeMap[req.body.matchType][0],
            matchNumber : req.body.matchNumber,
            teamNumber : req.body.teamNumber,
            tournamentKey : req.body.tournamentKey
        })
        if (!paramsScoutReport.success) {
            res.status(400).send({"error" : paramsScoutReport, "displayError" : "Invalid input. Make sure you are using the correct input."});
            return;
        };
        const scoutReportUuidRow = await prismaClient.scoutReport.findUnique({
            where :
            {
                uuid : paramsScoutReport.data.uuid
            }
        })
        if(scoutReportUuidRow)
        {
            res.status(400).send({"error" : `The scout report uuid ${paramsScoutReport.data.uuid} already exists.`, "displayError" : "Scout report already uploaded"})
            return
        }
        const scouter = await prismaClient.scouter.findUnique({
            where :
            {
                uuid : paramsScoutReport.data.scouterUuid
            }
        })
        if(!scouter)
        {
            res.status(400).send({"error" : `This ${paramsScoutReport.data.scouterUuid} has been deleted or never existed.`, "displayError" : "This scouter has been deleted. Reset your settings and choose a new scouter."})
            return
        }
        const tournamentMatchRows = await prismaClient.teamMatchData.findMany({
            where :
            {
                tournamentKey : paramsScoutReport.data.tournamentKey
            }
        })
        if(tournamentMatchRows === null || tournamentMatchRows.length === 0)
        {
            await addTournamentMatches(paramsScoutReport.data.tournamentKey)
        }
        const matchRow = await prismaClient.teamMatchData.findFirst({
            where :
            {
                tournamentKey : paramsScoutReport.data.tournamentKey,
                matchNumber : paramsScoutReport.data.matchNumber,
                matchType : paramsScoutReport.data.matchType,
                teamNumber : paramsScoutReport.data.teamNumber
            }
        })
        if(!matchRow)
        {
            res.status(404).send({"error" : `There are no matches that meet these requirements. ${paramsScoutReport.data.tournamentKey}, ${paramsScoutReport.data.matchNumber}, ${paramsScoutReport.data.matchType}, ${paramsScoutReport.data.teamNumber}`, "displayError" : "Match does not exist"})
            return
        }
        const matchKey = matchRow.key
        
        const row = await prismaClient.scoutReport.create(
            {
                data: {
                    //constants
                    uuid : paramsScoutReport.data.uuid,
                    teamMatchKey: matchKey,
                    startTime: new Date(paramsScoutReport.data.startTime),
                    scouterUuid: paramsScoutReport.data.scouterUuid,
                    notes: paramsScoutReport.data.notes,
                    robotRole: paramsScoutReport.data.robotRole,
                    driverAbility: paramsScoutReport.data.driverAbility,
                    //game specfific

                    pickUp: paramsScoutReport.data.pickUp,
                    autoChargingResult: paramsScoutReport.data.autoChargingResult,
                    endChargingResult: paramsScoutReport.data.endChargingResult
                }
            }
        )
        const scoutReportUuid = row.uuid
        const eventDataArray = []
        const events = req.body.events;
        let ampOn = false
        for(const event of events) {
            let points = 0;
            const time = event[0];
            const position = PositionMap[event[2]][0];
            const action = EventActionMap[event[1]][0]
            if (time <= 18) {
                if (action === "SCORE") {
                    if (position === "GRID_ONE_LOW" || position === "GRID_TWO_LOW" || position === "GRID_THREE_LOW") {
                        points = 3
                    }
                    else if (position === "GRID_ONE_MID" || position === "GRID_TWO_MID" || position === "GRID_THREE_MID") {
                        points = 4
                    }
                    else if (position === "GRID_ONE_HIGH" || position === "GRID_TWO_HIGH" || position === "GRID_THREE_HIGH") {
                        points = 6
                    }
                }

                else if (action === "LEAVE") {
                    points = 3
                }
            }
            else {
                if (action === "SCORE") {
                    if (position === "GRID_ONE_LOW" || position === "GRID_TWO_LOW" || position === "GRID_THREE_LOW") {
                        points = 2
                    }
                    else if (position === "GRID_ONE_MID" || position === "GRID_TWO_MID" || position === "GRID_THREE_MID") {
                        points = 3
                    }
                    else if (position === "GRID_ONE_HIGH" || position === "GRID_TWO_HIGH" || position === "GRID_THREE_HIGH") {
                        points = 5
                    }
                }
            }
            const paramsEvents = z.object({
                time: z.number(),
                action: z.enum(["LEAVE", "PICK_UP_CONE", "PICK_UP_CUBE", "SCORE", "DEFENSE", "STARTING_POSITION"]),
                position: z.enum(["NONE", "GRID_ONE_LOW", "GRID_ONE_MID", "GRID_ONE_HIGH", "GRID_TWO_LOW", "GRID_TWO_MID", "GRID_TWO_HIGH", "GRID_THREE_LOW", "GRID_THREE_MID", "GRID_THREE_HIGH", "SCORE_HIGH", "SCORE_MID", "SCORE_LOW", "AUTO_PIECE_ONE", "AUTO_PIECE_TWO", "AUTO_PIECE_THREE", "AUTO_PIECE_FOUR", "START_ONE", "START_TWO", "START_THREE"]),
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
                res.status(400).send({"error" : paramsEvents, "displayError" : "Invalid input. Make sure you are using the correct input."});
                return;
            };
            eventDataArray.push( {
                time: paramsEvents.data.time,
                action: paramsEvents.data.action,
                position: paramsEvents.data.position,
                points: paramsEvents.data.points,
                scoutReportUuid: scoutReportUuid
            })
        }
        const rows = await prismaClient.event.createMany({
            data : eventDataArray
        })
        const totalPoints = await totalPointsScoutingLead(scoutReportUuid)
        //recalibrate the max resonable points for every year 
        //uncomment for scouting lead
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
        res.status(500).send({"error" : error, "displayError" : "Error"});

    }
}


