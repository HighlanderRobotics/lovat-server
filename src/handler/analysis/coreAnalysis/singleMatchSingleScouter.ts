import { Request, Response } from "express";
import prismaClient from '../../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { driverAbility, highNoteMap, matchTimeEnd, metricToEvent, stageMap } from "../analysisConstants";
import { sum } from "simple-statistics";



export const singleMatchSingleScouter = async (req: AuthenticatedRequest,  isPointAverage: boolean, matchKey: string,  metric1 : string,  scouterUuid : string, timeMin: number = 0, timeMax : number = matchTimeEnd): Promise<number> => {
    try {

        const metric = metricToEvent[metric1]
        if (metric === driverAbility) {
            
            const sumOfMatches = await prismaClient.scoutReport.aggregate({
                _avg:
                {
                    driverAbility: true
                },
                where:
                {
                    teamMatchKey: matchKey,                    
                    scouterUuid: scouterUuid
                }
            })
            //avg could be multiple results from one scout
            return sumOfMatches._avg.driverAbility
        }
        else if (isPointAverage) {
            
                const sumOfMatches = await prismaClient.event.groupBy({
                    by: ["scoutReportUuid"],
                    _sum:
                    {
                        points: true
                    },
                    where:
                    {
                        scoutReport: {
                            teamMatchKey: matchKey,
                            scouterUuid : scouterUuid

                        },
                        //no need for action, either has points or has 0
                        // action:{
                        //     in : pointMetrics
                        // },
                        time : 
                        {
                            lt : timeMax,
                            gt : timeMin
                        }

                    }
                })
                if(sumOfMatches.length === 0)
                {
                    return 0
                }
                const eventsAverage = sumOfMatches.reduce((acc, val) => acc + val._sum.points, 0) / sumOfMatches.length;
                //adds endgame/climbing points if nessisary
                if(metric === "totalpoints" || metric === "teleoppoints")
                {
                    let stagePoints = []
                    const scoutReports = await prismaClient.scoutReport.findMany({
                        where :
                        {
                            teamMatchData:
                            {
                               
                                tournamentKey: {
                                    in: req.user.tournamentSource
                                },
                            },
                            scouter:
                            {
                                sourceTeamNumber:
                                {
                                    in: req.user.teamSource
                                }
                            },
                        }
                    })
                    for(let element of scoutReports)
                    {
                        let currStagePoints = stageMap[element.stage] + highNoteMap[element.highNote]
                        stagePoints.push(currStagePoints)
                    }
                    let  stagePointsAverage = 0
                    if (stagePoints.length > 0) {
                        stagePointsAverage = stagePoints.reduce((acc, val) => acc + val, 0) / stagePoints.length;
                    }
                    return eventsAverage + stagePointsAverage
                }
                
            return eventsAverage


            
            }


        
        else {
            const mapMetricsToEnums = {defense : "DEFENSE"}

            const params = z.object({
                metric: z.enum(["LEAVE", "DEFENSE", "SCORE_AMP", "SCORE_SPEAKER", "PICK_UP", "DROP_RING", "TRAP"]),
            }).safeParse({
                metric: metric,
            })
            if (!params.success) {
                throw (params)
            };
            
            const sumOfMatches = await prismaClient.event.groupBy({
                by: ["scoutReportUuid"],
                _count:
                {
                    _all: true
                },
                where:
                {
                    scoutReport: {
                        teamMatchKey: matchKey,
                        scouterUuid : scouterUuid

                    },
                    action: params.data.metric,
                    time : 
                    {
                        lt : timeMax,
                        gt : timeMin
                    }

                }
            })
            if(sumOfMatches.length === 0)
            {
                return 0
            }
            const average = sumOfMatches.reduce((acc, val) => acc + val._count._all, 0) / sumOfMatches.length;
            return average

        }
    }
    catch (error) {
        console.error(error)
        throw (error)
    }

};