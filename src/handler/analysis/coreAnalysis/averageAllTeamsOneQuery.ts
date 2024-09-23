import prismaClient from '../../../prismaClient'
import { autoEnd, matchTimeEnd, Metric, teleopStart } from "../analysisConstants";
import { Position, User } from "@prisma/client";


export const averageAllTeamOneQuery = async (user: User, metric: Metric): Promise<number> => {
    try {
        if (metric === Metric.driverability) {
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
            if (metric === Metric.ampscores) {
                position = Position.AMP
            }
            else if (metric === Metric.speakerscores) {
                position = Position.SPEAKER
            }
            else if (metric === Metric.trapscores) {
                position = Position.TRAP
            }
            else {
                position = Position.NONE
            }
            if (metric === Metric.pickups) {
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
                        action : "PICK_UP"

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
            else if (metric === Metric.teleoppoints || metric === Metric.autopoints || metric === Metric.totalpoints)
            {
                let timeMin = 0
                let timeMax = matchTimeEnd
                if (metric === Metric.teleoppoints)
                {
                    timeMin = teleopStart
                }
                else if (metric === Metric.autopoints)
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
                        action : "SCORE",
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