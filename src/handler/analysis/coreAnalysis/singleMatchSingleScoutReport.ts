import { Request, Response } from "express";
import prismaClient from '../../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { driverAbility, highNoteMap, matchTimeEnd, metricToEvent, stageMap, teleopStart } from "../analysisConstants";
import { sum } from "simple-statistics";
import { EventAction, Position } from "@prisma/client";
import { match } from "assert";
import { time } from "console";



export const singleMatchSingleScoutReport = async (req: AuthenticatedRequest, isPointAverage: boolean, scoutReportUuid: string, metric1: string, timeMin: number = 0, timeMax: number = matchTimeEnd): Promise<number> => {
    try {
        let position = null
        if(metric1 === "ampscores"  || metric1 === "ampScores")
        {
            position = Position.AMP
        }
        else if(metric1 === "speakerscores" || metric1 === "speakerScores")
        {
            position = Position.SPEAKER
        }
        else if(metric1 === "trapscores" || metric1 === "trapScores")
        {
            position = Position.TRAP
        }
        else
        {
            position = Position.NONE
        }

        // const params = z.object({
        //     matchKey: z.string(),
        //     //metric enums are same as allMetrics
        //     metric: z.enum(["totalpoints", "driverability", "teleoppoints", "autopoints", "pickups", "ampscores", "speakerscores", "trapscores", "stage", "cooperation"])
        // }).safeParse({
        //     matchKey: matchKey,
        //     metric: metric1
        // })
        const metric = metricToEvent[metric1][0]
        // if (metric1 === "stage") {
        //     const scoutReports = await prismaClient.scoutReport.findMany({
        //         where:
        //         {
        //             teamMatchData:
        //             {

        //                 tournamentKey: {
        //                     in: req.user.tournamentSource
        //                 },
        //             },
        //             scouter:
        //             {
        //                 sourceTeamNumber:
        //                 {
        //                     in: req.user.teamSource
        //                 }
        //             },
        //         }
        //     })
        //     let stagePoints = []
        //     for (let element of scoutReports) {
        //         let currStagePoints = stageMap[element.stage] + highNoteMap[element.highNote]
        //         stagePoints.push(currStagePoints)
        //     }
        //     let stagePointsAverage = 0
        //     if (stagePoints.length > 0) {
        //         stagePointsAverage = stagePoints.reduce((acc, val) => acc + val, 0) / stagePoints.length;
        //     }
        //     return stagePointsAverage
        // }
        if(metric1 === "pickups")
        {
            const match = await prismaClient.event.aggregate({
                _count:
                {
                    _all: true
                },
                where:
                {
                    scoutReport: {
                        uuid : scoutReportUuid
                    },
                    action: "PICK_UP",
                    time:
                    {
                        lte: timeMax,
                        gte: timeMin
                    },
                }
            })
            
            return match._count._all
        }
        else if (metric1 === "driverability") {

            const match = await prismaClient.scoutReport.findUnique({
               
                where:
                {
                    uuid : scoutReportUuid
                }
            })
            //avg could be multiple results from one scout
            return match.driverAbility
        }
        else if (isPointAverage) {
            const sumOfMatches = await prismaClient.event.aggregate({
                _sum:
                {
                    points: true
                },
                where:
                {
                    scoutReport: {
                        uuid : scoutReportUuid

                    },
                    //no need for action, either has points or has 0
                    // action:{
                    //     in : pointMetrics
                    // },
                    time:
                    {
                        lte: timeMax,
                        gte: timeMin
                    }

                }
            })
            
            let eventsAverage = sumOfMatches._sum.points
            if(!eventsAverage)
            {
                eventsAverage = 0
            }
            //adds endgame points if nessisary
            if (metric === "totalpoints" || metric === "teleoppoints") {
                const element = await prismaClient.scoutReport.findUnique({
                    where:
                    {
                        uuid : scoutReportUuid
                    }
                })
                let stagePoints = stageMap[element.stage] + highNoteMap[element.highNote]
                if(!stagePoints)
                {
                    stagePoints = 0
                }
                return eventsAverage + stagePoints
            }
            else
            {
                return eventsAverage
            }
        }
       
        else {
            const params = z.object({
                metric: z.enum([EventAction.PICK_UP, EventAction.DEFENSE, EventAction.DROP_RING, EventAction.FEED_RING, EventAction.LEAVE, EventAction.SCORE]),
                position : z.enum([Position.NONE, Position.AMP, Position.TRAP, Position.SPEAKER])
            }).safeParse({
                metric: metric,
                position : position
            })
            if (!params.success) {
                throw (params)
            };

            const match = await prismaClient.event.aggregate({
                _count:
                {
                    _all: true
                },
                where:
                {
                    scoutReport: {
                        uuid : scoutReportUuid
                    },
                    action: params.data.metric,
                    time:
                    {
                        lte: timeMax,
                        gte: timeMin
                    },
                    position : position

                }
            })
            return match._count._all

        }
    }
    catch (error) {
        console.error(error.error)
        throw (error)
    }

};