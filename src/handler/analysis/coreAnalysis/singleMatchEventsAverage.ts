import { Request, Response } from "express";
import prismaClient from '../../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { driverAbility, matchTimeEnd } from "../analysisConstants";


export const singleMatchEventsAverage = async (req: AuthenticatedRequest,  isPointAverage: boolean, matchKey: string, team: number, metric : string, timeMin: number = 0, timeMax : number = matchTimeEnd): Promise<number> => {
    try {
        //DO SOME GAME SPECIFIC PROCESSING THAT CONVERTS THE METRIC TO THE ENUM/OTHER NAME

        if (metric === driverAbility) {
            
         
            const sumOfMatches = await prismaClient.scoutReport.aggregate({
                _avg:
                {
                    driverAbility: true
                },
                where:
                {
                    teamMatchKey: matchKey,
                    teamMatchData:
                    {
                        //shouldnt be looking at tournaments not in their data set but im just checking
                        //maybe if they are delibratly looking at a tournament not in their fata set we should give a notification or something?
                        tournamentKey: {
                            in: req.user.tournamentSource
                        },
                        teamNumber : team
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
            //should be null if the data doesnt exist
            return sumOfMatches._avg.driverAbility
        }
        else if (isPointAverage) {
       
            if(metric === "totalPoints")
            {

            }
            else if(metric === "totalPointsAuto")
            {

            }
            else if(metric === "totalPointsTeleop")
            {

            }
            else{

            
                const pointMetrics = []
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
                            teamMatchData:
                            {
                                //shouldnt be looking at tournaments not in their data set but im just checking
                                //maybe if they are delibratly looking at a tournament not in their fata set we should give a notification or something?
                                tournamentKey: {
                                    in: req.user.tournamentSource
                                },
                                teamNumber : team
                            },
                            scouter:
                            {
                                sourceTeamNumber:
                                {
                                    in: req.user.teamSource
                                }
                            },

                        },
                        action:{
                            in : pointMetrics
                        },
                        time : 
                        {
                            lt : timeMax,
                            gt : timeMin
                        }

                    }
                })
            
                const average = sumOfMatches.reduce((acc, val) => acc + val._sum.points, 0) / sumOfMatches.length;
                return average
            }
            }


        
        else {
            const mapMetricsToEnums = {defense : "DEFENSE"}

            const params = z.object({
                metric: z.enum(["LEAVE", "DEFENSE", "SCORE_AMP", "SCORE_SPEAKER", "PICK_UP"]),
                team : z.number()
            }).safeParse({
                metric: metric,
                team : team
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
                        teamMatchData:
                        {
                            //shouldnt be looking at tournaments not in their data set but im just checking
                            //maybe if they are delibratly looking at a tournament not in their fata set we should give a notification or something?
                            tournamentKey: {
                                in: req.user.tournamentSource
                            },
                            teamNumber : params.data.team
                        },
                        scouter:
                        {
                            sourceTeamNumber:
                            {
                                in: req.user.teamSource
                            }
                        },

                    },
                    action: params.data.metric,
                    time : 
                    {
                        lt : timeMax,
                        gt : timeMin
                    }

                }
            })
            const average = sumOfMatches.reduce((acc, val) => acc + val._count._all, 0) / sumOfMatches.length;
            return average

        }
    }
    catch (error) {
        console.error(error)
        throw (error)
    }

};