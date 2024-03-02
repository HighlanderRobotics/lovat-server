import { Request, Response } from "express";
import prismaClient from '../../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { driverAbility, highNoteMap, matchTimeEnd, metricToEvent, stageMap, teleopStart } from "../analysisConstants";
import { sum } from "simple-statistics";
import { EventAction, Position } from "@prisma/client";
import { match } from "assert";
import { time } from "console";



export const teamAverageFastTournament = async (req: AuthenticatedRequest, team : number,  isPointAverage: boolean, metric1: string, tournamentKey : string,  timeMin: number = 0, timeMax: number = matchTimeEnd): Promise<number> => {
    try {
        let position = null
        if(metric1 === "ampscores" )
        {
            position = Position.AMP
        }
        else if(metric1 === "speakerscores" )
        {
            position = Position.SPEAKER
        }
        else if(metric1 === "trapscores" )
        {
            position = Position.TRAP
        }
        else
        {
            position = Position.NONE
        }
        const metric = metricToEvent[metric1][0]

        if(metric1 === "pickups")
        {
            const counts = await prismaClient.event.groupBy({
                by : ["scoutReportUuid"],
                _count :
                {
                    _all : true
                },
                where:
                {
                    scoutReport :
                    {
                        teamMatchData :
                        {
                            tournamentKey : tournamentKey,
                            teamNumber : team
                        },
                        scouter :
                        {
                            sourceTeamNumber :
                            {
                                in : req.user.teamSource
                            }
                        },
                        
                    },
                    action: EventAction.PICK_UP,
                    time:
                    {
                        lte: timeMax,
                        gte: timeMin
                    },
                }
            })
            
             return counts.reduce((acc, cur) => acc + cur._count._all, 0) / counts.length;

        }
        else if (metric1 === "driverability") {

            const driverAbilityAvg = await prismaClient.scoutReport.aggregate({
               _avg :
               {
                driverAbility : true
               },
               where :
               {
                    teamMatchData :
                    {
                        tournamentKey : tournamentKey,
                        teamNumber : team,
                        
                    },
                    scouter :
                    {
                        sourceTeamNumber :
                        {
                            in : req.user.teamSource
                        }
                    }
               }
            })
            //avg could be multiple results from one scout
            let avg=  driverAbilityAvg._avg.driverAbility
            if(!avg)
            {
                avg = 0
            }
            return avg
        }
        else if (isPointAverage) {
            const sumOfMatches = await prismaClient.event.groupBy({
                by : ["scoutReportUuid"],
                _sum:
                {
                    points: true
                },
                where:
                {
                    scoutReport: {
                        teamMatchData :
                        {
                            tournamentKey : tournamentKey,
                            teamNumber : team
                        },
                        scouter :
                        {
                            sourceTeamNumber :
                            {
                                in : req.user.teamSource
                            }
                        }
                    },
                    time:
                    {
                        lte: timeMax,
                        gte: timeMin
                    }

                }
            })
            
            let eventsAverage =sumOfMatches.reduce((acc, currentValue) => {
                return acc + (currentValue._sum.points || 0);
            }, 0) /sumOfMatches.length;
            
            if(!eventsAverage)
            {
                eventsAverage = 0
            }
            //adds endgame points if nessisary
            if (metric === "totalpoints" || metric === "teleoppoints") {
                const stageRows = await prismaClient.scoutReport.groupBy({
                    by: ['stage'],
                    _count: {
                        stage: true,
                    },
                    where: {
                        teamMatchData: {
                            tournamentKey: {
                                in: req.user.tournamentSource
                            },
                            teamNumber: team,
                        },
                        scouter: {
                            sourceTeamNumber: {
                                in: req.user.teamSource
                            }
                        }
                    }
                });
                const totalAttemptsStage = stageRows.reduce((total, item) => {
                    if (item.stage !== "NOTHING") {
                        return total + item._count.stage;
                    }
                    return total;
                }, 0);
                let stagePoints = 0
                if(totalAttemptsStage !== 0)
                {
                    stagePoints = (stageMap["ONSTAGE"]/totalAttemptsStage) * 3 +  (stageMap["ONSTAGE_HARMONY"]/totalAttemptsStage) * 5 + (stageMap["PARK"]/totalAttemptsStage) 
                }
                const highNoteRows = await prismaClient.scoutReport.groupBy({
                    by: ['highNote'],
                    _count: {
                        highNote: true,
                    },
                    where: {
                        teamMatchData: {
                            tournamentKey: {
                                in: req.user.tournamentSource
                            },
                            teamNumber: team,
                        },
                        scouter: {
                            sourceTeamNumber: {
                                in: req.user.teamSource
                            }
                        }
                    }
                });
                const totalAttempsHighNote = highNoteRows.reduce((total, item) => {
                    if (item.highNote !== "NOT_ATTEMPTED") {
                        return total + item._count.highNote;
                    }
                    return total;
                }, 0);
                let highNotePoints = 0
                if(totalAttemptsStage !== 0)
                {
                    stagePoints = highNoteMap["SUCCESSFUL"]/totalAttempsHighNote
                }
               
                if(!highNotePoints)
                {
                    highNotePoints = 0
                }  
                if(!stagePoints)
                {
                    stagePoints = 0
                }                
                return eventsAverage + highNotePoints + stagePoints 
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

            const groupedMatches = await prismaClient.event.groupBy({
                by : ["scoutReportUuid"],
                _count:
                {
                    _all: true
                },
                where:
                {
                    scoutReport: {
                        teamMatchData :
                        {
                            tournamentKey : tournamentKey,
                            teamNumber : team
                        },
                        scouter :
                        {
                            sourceTeamNumber :
                            {
                                in : req.user.teamSource
                            }
                        }
                    },
                
                    action: params.data.metric,
                    time:
                    {
                        lte: timeMax,
                        gte: timeMin
                    },
                    position : params.data.position

                }
            })
            
            let avg = groupedMatches.reduce((accumulator, current) => {
                return accumulator + current._count._all; 
            }, 0) /groupedMatches.length;
            if(!avg)
            {
                avg =0
            }
            return avg

        }
    }
    catch (error) {
        console.error(error.error)
        throw (error)
    }

};