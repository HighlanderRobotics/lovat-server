import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import { match } from "assert";
import z from 'zod'
import { singleMatchSingleScouter } from "../analysis/coreAnalysis/singleMatchSingleScouter";
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";


export const addScoutReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {


    try {
        let matchData = req.body.data;
        let matchKey = req.body.matchKey;
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
            stage : z.enum([ "NOTHING",
                "PARK",
                "ONSTAGE",
                "ONSTAGE_HARMONY"
              ]),
            highNote : z.enum(["YES", "NO"]),
            trap : z.enum(["YES", "NO"]),
            pickUp : z.enum(["GROUND", "CHUTE", "BOTH"]),

            driverAbility: z.number(),
            scouterUuid: z.string()
        }).safeParse({
            teamMatchKey: matchKey, 
            scouterUuid: matchData.scouterUuid, 
            startTime: matchData.startTime, 
            notes: matchData.notes, 
            links: matchData.links, 
            robotRole: matchData.robotRole, 
            autoChallengeResult: matchData.autoChallengeResult, 
            teleopChallengeResult: matchData.challengeResult, 
            penaltyCard: matchData.penaltyCard, 
            driverAbility: matchData.driverAbility,
            highNote : matchData.highNote,
            pickUp : matchData.pickUp,
            stage : matchData.stage,
            trap : matchData.trap
        })
        if (!paramsScoutReport.success) {
            res.status(400).send(paramsScoutReport);
            return;
        };
       
        const row = await prismaClient.scoutReport.create(
            {
                data: {
                    //constants
                    teamMatchKey : paramsScoutReport.data.teamMatchKey,
                    scouterUuid : paramsScoutReport.data.scouterUuid,
                    startTime : paramsScoutReport.data.startTime,
                    notes : paramsScoutReport.data.notes,
                    robotRole : paramsScoutReport.data.robotRole,
                    driverAbility : paramsScoutReport.data.driverAbility,
                    //game specfific
                    highNote : paramsScoutReport.data.highNote,
                    trap : paramsScoutReport.data.trap,
                    stage : paramsScoutReport.data.stage,
                    pickUp : paramsScoutReport.data.pickUp
                }
            }
        )


        let events = matchData.events;
        for (let i = 0; i < events.length; i++) {
            let points = 0;
            let time = events[i][0];
            let position = events[i][2];
            if (events[i][1] === 2) {
                let level = Math.ceil(position / 3);
                if (time <= 17) {
                    if (level === 1) {
                        points = 3;
                    }
                    else if (level === 2) {
                        points = 4;
                    }
                    else if (level === 3) {
                        points = 6;
                    }
                }
                else {
                    if (level === 1) {
                        points = 2;
                    }
                    else if (level === 2) {
                        points = 3;
                    }
                    else if (level === 3) {
                        points = 5;
                    }
                }
            }
            const paramsEvents = z.object({
                time: z.number(),
                action: z.enum(["PICK_UP_CONE", "PICK_UP_CUBE", "PLACE_OBJECT"]),
                position: z.enum(["NONE", "PLACE_HOLDER"]),
                points: z.number(),
                scoutReportUuid: z.string()
            }).safeParse({
                scoutReportUuid: scoutReportUuid,
                time: events[i][0],
                action: events[i][1],
                position: events[i][2],
                points: points
            })
            if (!paramsEvents.success) {
                res.status(400).send(paramsEvents);
                return;
            };
        }
        const totalPoints = await singleMatchSingleScouter(req,  "", true, matchKey, matchData.scouterUuid)
        //recalibrate the max resonable points for every year 
        if(totalPoints === 0 || totalPoints > 80)
        {
           await prismaClient.flaggedScoutReport.create({
                data :
                {
                    note : `${totalPoints} recorded`,
                    scoutReportUuid : scoutReportUuid
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


