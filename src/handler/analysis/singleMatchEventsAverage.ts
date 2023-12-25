import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";


export const singleMatchEventsAverage = async (req: AuthenticatedRequest, metric, isPointAverage: boolean, matchKey: string, team: number): Promise<number> => {
    try {

        if (isPointAverage) {
            let timeMin = 0
            //could be 150, but putting more for buffer for now
            let timeMax = 200
            if (metric === "teleopPoints") {
                //3 sec inbetween teleop and auto where things are still counted, I will put a 3 sec buffer for now
                //18 and not 17 so it doesnt double count things that happen on the 17 mark when calculating teleop/auto averages (see primsa below)
                timeMin = 18
            }
            else if(metric === "autoPoints")
            {
                timeMax = 17
            }
           
            else {


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
                                teamNumber: team,
                                //shouldnt be looking at tournaments not in their data set but im just checking
                                //maybe if they are delibratly looking at a tournament not in their fata set we should give a notification or something?
                                tournamentKey: {
                                    in: req.user.tournamentSource
                                }
                            },
                            scouter:
                            {
                                sourceTeamNumber:
                                {
                                    in: req.user.teamSource
                                }
                            },

                        },
                        action: metric,
                        time : {
                          gte : timeMin,
                          lte : timeMax
                        }

                    }
                })
                const average = sumOfMatches.reduce((acc, val) => acc + val._sum.points, 0) / sumOfMatches.length;
                return average
            }
            

        }
        else {
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
                            teamNumber: team,
                            //shouldnt be looking at tournaments not in their data set but im just checking
                            //maybe if they are delibratly looking at a tournament not in their fata set we should give a notification or something?
                            tournamentKey: {
                                in: req.user.tournamentSource
                            }
                        },
                        scouter:
                        {
                            sourceTeamNumber:
                            {
                                in: req.user.teamSource
                            }
                        },

                    },
                    action: metric

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