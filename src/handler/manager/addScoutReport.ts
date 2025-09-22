import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AlgaePickupMap, PositionMap, MatchTypeMap, CoralPickupMap, BargeResultMap, KnocksAlgaeMap, UnderShallowCageMap, RobotRoleMap, EventActionMap} from "./managerConstants";
import { addTournamentMatches } from "./addTournamentMatches";
import {EventAction, Position} from "@prisma/client";
import { AlgaePickup, BargeResult, CoralPickup, KnocksAlgae, MatchType, RobotRole, UnderShallowCage } from "@prisma/client";
import { sendWarningToSlack } from "../slack/sendWarningNotification";

export const addScoutReport = async (req: Request, res: Response): Promise<void> => {
    try {
        const paramsScoutReport = z.object({
            uuid : z.string(),
            tournamentKey : z.string(),
            matchType : z.nativeEnum(MatchType),
            matchNumber : z.number(),
            startTime: z.number(),
            notes: z.string(),
            robotRole: z.nativeEnum(RobotRole),
            barge: z.nativeEnum(BargeResult),
            coralPickUp: z.nativeEnum(CoralPickup),
            algaePickUp: z.nativeEnum(AlgaePickup),
            knocksAlgae: z.nativeEnum(KnocksAlgae),
            traversesUnderCage: z.nativeEnum(UnderShallowCage),
            robotBrokeDescription: z.union([z.string(), z.null(), z.undefined()]).optional(),
            driverAbility: z.number(),
            scouterUuid: z.string(),
            teamNumber : z.number()
        }).safeParse({
            uuid : req.body.uuid,
            scouterUuid: req.body.scouterUuid,
            startTime: req.body.startTime,
            notes: req.body.notes,
            robotRole:  RobotRoleMap[req.body.robotRole],
            driverAbility:  req.body.driverAbility,
            barge:  BargeResultMap[req.body.barge],
            algaePickUp:  AlgaePickupMap[req.body.algaePickUp],
            coralPickUp:  CoralPickupMap[req.body.coralPickUp],
            knocksAlgae: KnocksAlgaeMap[req.body.knocksAlgae],
            traversesUnderCage: UnderShallowCageMap[req.body.traversesUnderCage],
            robotBrokeDescription: req.body.robotBrokeDescription,
            matchType : MatchTypeMap[req.body.matchType],
            matchNumber : req.body.matchNumber,
            teamNumber : req.body.teamNumber,
            tournamentKey : req.body.tournamentKey
        })
        if (!paramsScoutReport.success) {
            res.status(400).send({"error" : paramsScoutReport, "displayError" : "Invalid input. Make sure you are using the correct input."});
            return;
        };

        // Make sure UUID does not already exist in database
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

        // Check that scouter exists
        const scouter = await prismaClient.scouter.findFirst({
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

        // Add tournament matches if they dont exist
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


        // Get key for relevant TeamMatchData
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
        

        // Create scout report in database
        await prismaClient.scoutReport.create(
            {
                data: {
                    //constants
                    uuid : paramsScoutReport.data.uuid,
                    startTime: new Date(paramsScoutReport.data.startTime),
                    teamMatchData: {connect: { key: matchKey }},
                    scouter: {connect: { uuid: paramsScoutReport.data.scouterUuid }},
                    notes: paramsScoutReport.data.notes,
                    robotRole: paramsScoutReport.data.robotRole,
                    driverAbility: paramsScoutReport.data.driverAbility,
                    robotBrokeDescription: paramsScoutReport.data.robotBrokeDescription ?? null,
                    
                    //game specfific
                    coralPickup: paramsScoutReport.data.coralPickUp,
                    bargeResult: paramsScoutReport.data.barge,
                    algaePickup: paramsScoutReport.data.algaePickUp,
                    knocksAlgae: paramsScoutReport.data.knocksAlgae,
                    underShallowCage: paramsScoutReport.data.traversesUnderCage,
            }
    })
        const scoutReportUuid = paramsScoutReport.data.uuid
        

        const eventDataArray = []
        const events = req.body.events;

        let doesLeave = false;

        for (const event of events) {
            let points = 0;
            const time = event[0];
            const action = EventActionMap[event[1]];
            const position = PositionMap[event[2]];
            if (time <= 18) {
                if (action === EventAction.SCORE_CORAL) {
                    if (position === Position.LEVEL_ONE_A || position === Position.LEVEL_ONE_B || position === Position.LEVEL_ONE_C) {
                        points = 3
                    }
                    else if (position === Position.LEVEL_TWO_A || position === Position.LEVEL_TWO_B || position === Position.LEVEL_TWO_C) {
                        points = 4
                    }
                    else if (position === Position.LEVEL_THREE_A || position === Position.LEVEL_THREE_B || position === Position.LEVEL_THREE_C) {
                        points = 6
                    }
                    else if (position === Position.LEVEL_FOUR_A || position === Position.LEVEL_FOUR_B || position === Position.LEVEL_FOUR_C) {
                        points = 7
                    }
                }
                else if (action === EventAction.AUTO_LEAVE) {
                    points = 3

                    doesLeave = true;
                }
                else if (action === EventAction.SCORE_PROCESSOR) {
                    points = 6
                }
                else if (action === EventAction.SCORE_NET) {
                    points = 4
                }
            }
            else {
                if (action === EventAction.SCORE_CORAL) {
                    if (position === Position.LEVEL_ONE) {
                        points = 2
                    }
                    else if (position === Position.LEVEL_TWO) {
                        points = 3
                    }
                    else if (position === Position.LEVEL_THREE) {
                        points = 4
                    }
                    else if (position === Position.LEVEL_FOUR) {
                        points = 5
                    }
                }
                else if (action === EventAction.SCORE_PROCESSOR) {
                    points = 6
                }
                else if (action === EventAction.SCORE_NET) {
                    points = 4
                }
            }

            const paramsEvents = z.object({
                time: z.number(),
                action: z.nativeEnum(EventAction),
                position: z.nativeEnum(Position),
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

        if (!doesLeave) {
            sendWarningToSlack("AUTO_LEAVE", matchRow.matchNumber, matchRow.teamNumber, matchRow.tournamentKey, paramsScoutReport.data.uuid);
        }

        if (paramsScoutReport.data.robotBrokeDescription != null || undefined) {
            sendWarningToSlack("BREAK", matchRow.matchNumber, matchRow.teamNumber, matchRow.tournamentKey, paramsScoutReport.data.uuid);
        }

        // Push event rows to prisma database
        const rows = await prismaClient.event.createMany({
            data : eventDataArray
        })

        //recalibrate the max reasonable points for every year 
        //uncomment for scouting lead

        // const totalPoints = await totalPointsScoutingLead(scoutReportUuid)
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