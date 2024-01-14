import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import { match } from "assert";
import z from 'zod'
import { singleMatchSingleScouter } from "../analysis/coreAnalysis/singleMatchSingleScouter";
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";
import { EventAction } from "@prisma/client";
import { ADDRGETNETWORKPARAMS } from "dns";
import { PickUpMap, PositionMap, matchTypeMap } from "./managerConstants";
import { highNoteMap, stageMap } from "../analysis/analysisConstants";


export const addScoutReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {


    try {
        let scoutReportUuid = req.body.uuid
        const paramsScoutReport = z.object({
            uuid: z.string(),
            teamMatchKey: z.string(),
            startTime: z.string(),
            notes: z.string(),
            robotRole: z.enum(["OFFENSE",
                "DEFENSE",
                "FEEDER",
                "IMMOBILE"]),
            stage: z.enum(["NOTHING",
                "PARK",
                "ONSTAGE",
                "ONSTAGE_HARMONY"
            ]),
            highNote: z.enum(["NOT_ATTEMPTED", "FAILED", "SUCCESSFUL"]),
            pickUp: z.enum(["GROUND", "CHUTE", "BOTH"]),

            driverAbility: z.number(),
            scouterUuid: z.string(),
            matchType : z.enum(["QUALIFICATION", "ELIMINATION"]),
            matchNumber : z.number(),
            tournamentKey : z.string(),
            teamNumber : z.number()
        }).safeParse({
            teamMatchKey: req.body.matchKey,
            scouterUuid: req.body.scouterUuid,
            startTime: req.body.startTime,
            notes: req.body.notes,
            robotRole:  req.body.robotRole,
            driverAbility:  req.body.driverAbility,
            highNote:  highNoteMap[req.body.highNote][0],
            pickUp:  PickUpMap[req.body.pickUp][0],
            stage:  stageMap[req.body.stage][0],
            matchType : matchTypeMap[req.body.matchType][0],
            matchNumber : req.body.matchNumber,
            teamNumber : req.body.teamNumber,
            tournamentKey : req.body.tournamentKey
        })
        if (!paramsScoutReport.success) {
            res.status(400).send(paramsScoutReport);
            return;
        };
        const matchRow = await prismaClient.teamMatchData.findFirst({
            where :
            {
                tournamentKey : paramsScoutReport.data.tournamentKey,
                matchNumber : paramsScoutReport.data.matchNumber,
                matchType : paramsScoutReport.data.matchType,
                teamNumber : paramsScoutReport.data.teamNumber
            }
        })
        let matchKey = matchRow.key
        const row = await prismaClient.scoutReport.create(
            {
                data: {
                    //constants
                    teamMatchKey: matchKey,
                    scouterUuid: paramsScoutReport.data.scouterUuid,
                    startTime: paramsScoutReport.data.startTime,
                    notes: paramsScoutReport.data.notes,
                    robotRole: paramsScoutReport.data.robotRole,
                    driverAbility: paramsScoutReport.data.driverAbility,
                    //game specfific
                    highNote: paramsScoutReport.data.highNote,
                    stage: paramsScoutReport.data.stage,
                    pickUp: paramsScoutReport.data.pickUp
                
                }
            }
        )


        let events = req.body.events;
        let ampOn = false
        for (let i = 0; i < events.length; i++) {
            let points = 0;
            let time = events[i][0];
            let position = PositionMap[events[i][2]][0];
            let action = EventAction[events[i][1]][0]
            if (action === "START") {
                ampOn = true
            }
            else if (action === "STOP") {
                ampOn = false
            }
            else if (time <= 17) {
                if (action === "SCORE") {
                    if (position === "AMP") {
                        points = 2
                    }
                    else if (position === "SPEAKER") {
                        points = 5
                    }
                }

                else if (action === "LEAVE") {
                    points = 2
                }
            }
            else {
                if (action === "SCORE") {
                    if (position === "AMP") {
                        points = 1
                    }
                    else if (position === "SPEAKER" && ampOn) {
                        points = 5
                    }
                    else if (position === "SPEAKER") {
                        points = 2
                    }
                    else if (action === "TRAP") {
                        points = 5
                    }
                }

            }
            if (action !== "AMP_ON" && action !== "AMP_OFF") {


                const paramsEvents = z.object({
                    time: z.number(),
                    action: z.enum(["DEFENSE", "SCORE", "PICK_UP", "LEAVE", "DROP_RING", "FEED_RING"]),
                    position: z.enum(["NONE"]),
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
                    res.status(400).send(paramsEvents);
                    return;
                };
                const currEventRow = await prismaClient.event.create({
                    data:
                    {
                        time: paramsEvents.data.time,
                        action: paramsEvents.data.action,
                        position: paramsEvents.data.position,
                        points: paramsEvents.data.points,
                        scoutReportUuid: scoutReportUuid

                    }
                })
            }
        }
        const totalPoints = await singleMatchSingleScouter(req, true, req.body.matchKey, "totalpoints", req.body.scouterUuid)
        //recalibrate the max resonable points for every year 
        if (totalPoints === 0 || totalPoints > 80) {
            await prismaClient.flaggedScoutReport.create({
                data:
                {
                    note: `${totalPoints} recorded`,
                    scoutReportUuid: scoutReportUuid
                }

            })
        }
        res.status(200).send('done adding data');
    }

    catch (error) {
        console.log(error)
        res.status(400).send(error);

    }
}


