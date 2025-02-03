import prismaClient from '../../../prismaClient'
import { autoEnd, endgameToPoints, matchTimeEnd, Metric, metricToEvent, teleopStart } from "../analysisConstants";
import { EventAction, Position, User } from "@prisma/client";

/** Average all teams based on  */
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
        if (metric === Metric.bargePoints) {
            return 0;
        }
        if (metric === Metric.teleopPoints || metric === Metric.autoPoints || metric === Metric.totalPoints)
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

            if (allTeamData.length === 0) {
                return 0;
            }

            const averagePoints = allTeamData.reduce((acc, curr) => {
                return acc + curr._sum.points;
            }, 0) / allTeamData.length;

            let endgamePoints = 0
            if (metric === Metric.totalPoints || metric === Metric.teleopPoints) {
                const bargeResults = await prismaClient.scoutReport.findMany({
                    where: {
                        teamMatchData: {
                            tournamentKey: {
                                in: user.tournamentSource
                            }
                        },
                        scouter: {
                            sourceTeamNumber: {
                                in: user.teamSource
                            }
                        }
                    },
                    select: {
                        bargeResult: true
                    }
                });

                for (let i = 0; i < bargeResults.length; i++) {
                    endgamePoints += endgameToPoints[bargeResults[i].bargeResult];
                }
            }

            return averagePoints + (endgamePoints / allTeamData.length);

        }

        let position = undefined
        let action = undefined
        switch (metric) {
            case Metric.coralL1:
                action = EventAction.SCORE_CORAL
                position = Position.LEVEL_ONE
                break;
            case Metric.coralL2:
                action = EventAction.SCORE_CORAL
                position = Position.LEVEL_TWO
                break;
            case Metric.coralL3:
                action = EventAction.SCORE_CORAL
                position = Position.LEVEL_THREE
                break;
            case Metric.coralL4:
                action = EventAction.SCORE_CORAL
                position = Position.LEVEL_FOUR
                break;
            default:
                action = metricToEvent[metric] || undefined
                position = undefined
                break;
        }

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
                action : action,
                position : position
            }
        })

        if (allTeamData.length === 0) {
            return 0;
        }

        const averageScores = allTeamData.reduce((acc, curr) => {
            return acc + curr._count._all;
        }, 0) / allTeamData.length;

        return averageScores;

    }
    catch (error) {
        console.error(error)
        throw (error)
    }

};