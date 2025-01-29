import prismaClient from '../../../prismaClient'
import { autoEnd, matchTimeEnd, Metric, teleopStart } from "../analysisConstants";
import { EventAction, Position, User } from "@prisma/client";


export const averageAllTeamOneQuery = async (user: User, metric: Metric): Promise<number> => {
    try {
        if (metric === Metric.driverAbility) {
            const data = await prismaClient.scoutReport.aggregate({
                _avg: {
                    driverAbility: true
                },
                where:
                {
                    teamMatchData:
                    {
                        tournamentKey: {
                            in: user.tournamentSource
                        }
                    },
                    scouter:
                    {
                        sourceTeamNumber:
                        {
                            in: user.teamSource
                        }
                    }
                }
            })
            return data._avg.driverAbility
        }
        else {
            let position = null
            if (metric === Metric.coralL1) {
                position = Position.LEVEL_ONE
            }
            else if (metric === Metric.coralL2) {
                position = Position.LEVEL_TWO
            }
            else if (metric === Metric.coralL3) {
                position = Position.LEVEL_THREE
            }
            else if (metric === Metric.coralL4) {
                position = Position.LEVEL_FOUR
            }
            else {
                position = Position.NONE
            }
            if (metric === Metric.coralPickups || metric === Metric.algaePickups) {
                const allTeamData = await prismaClient.event.groupBy({
                    by : ["scoutReportUuid"],
                    _count :
                    {
                        _all : true
                    },
                    where :
                    {
                        scoutReport :
                        {
                            teamMatchData :
                            {
                                tournamentKey :
                                {
                                    in : user.tournamentSource
                                }
                            },
                            scouter :
                            {
                                sourceTeamNumber : {
                                    in : user.teamSource
                                }
                            }
                        },
                        action : {
                            [Metric.algaePickups]: EventAction.PICKUP_ALGAE,
                            [Metric.coralPickups]: EventAction.PICKUP_CORAL,
                        }[metric]

                    }

                })
                let averagePickups = allTeamData.reduce((acc, curr) => {
                    return acc + curr._count._all; 
                }, 0) / allTeamData.length;
                if (!averagePickups)
                {
                    averagePickups = 0
                }
                return averagePickups
            }
            else if (metric === Metric.teleopPoints || metric === Metric.autoPoints || metric === Metric.totalPoints)
            {
                let timeMin = 0
                let timeMax = matchTimeEnd
                if (metric === Metric.teleopPoints)
                {
                    timeMin = teleopStart
                }
                else if (metric === Metric.autoPoints)
                {
                    timeMax = autoEnd
                }
                const allTeamData = await prismaClient.event.groupBy({
                    by : ["scoutReportUuid"],
                    _sum :
                    {
                        points : true
                    },
                    where :
                    {
                        scoutReport :
                        {
                            teamMatchData :
                            {
                                tournamentKey :
                                {
                                    in : user.tournamentSource
                                }
                            },
                            scouter :
                            {
                                sourceTeamNumber : {
                                    in : user.teamSource
                                }
                            }
                        },
                        time : {
                            lte : timeMax,
                            gte : timeMin
                        }

                    }

                })
                let averagePoints = allTeamData.reduce((acc, curr) => {
                    return acc + curr._sum.points; 
                }, 0) / allTeamData.length;
                if(!averagePoints)
                {
                    averagePoints = 0
                }
                return averagePoints

            }
            else
            {
                const allTeamData = await prismaClient.event.groupBy({
                    by : ["scoutReportUuid"],
                    _count :
                    {
                        _all : true
                    },
                    where :
                    {
                        scoutReport :
                        {
                            teamMatchData :
                            {
                                tournamentKey :
                                {
                                    in :user.tournamentSource
                                }
                            },
                            scouter :
                            {
                                sourceTeamNumber : {
                                    in :user.teamSource
                                }
                            }
                        },
                        action : {
                            in: [
                                EventAction.SCORE_CORAL,
                                EventAction.SCORE_NET,
                                EventAction.SCORE_PROCESSOR,
                            ]
                        },
                        position : position

                    }

                })
                let averageScores = allTeamData.reduce((acc, curr) => {
                    return acc + curr._count._all; 
                }, 0) / allTeamData.length;
                if(!averageScores)
                {
                    averageScores = 0
                }
                return averageScores
            }
        }

    }
    catch (error) {
        console.error(error)
        throw (error)
    }

};