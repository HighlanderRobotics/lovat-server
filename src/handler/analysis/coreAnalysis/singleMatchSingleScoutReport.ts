import prismaClient from '../../../prismaClient'
import { matchTimeEnd, Metric, metricToEvent } from "../analysisConstants";
import { EventAction, Position, User } from "@prisma/client";
import { BargeResultPointMap } from '../../manager/managerConstants';


export const singleMatchSingleScoutReport = async (user: User, isPointAverage: boolean, scoutReportUuid: string, metric1: Metric, timeMin = 0, timeMax: number = matchTimeEnd): Promise<number> => {
    try {
        if (metric1 === Metric.driverAbility) {

            const match = await prismaClient.scoutReport.findUnique({

                where:
                {
                    uuid: scoutReportUuid
                }
            })
            //avg could be multiple results from one scout
            return match.driverAbility
        }
        else if (metric1 === Metric.autonLeaves) {
            const match = await prismaClient.event.aggregate({
                _count:
                {
                    _all: true
                },
                where:
                {
                    scoutReport: {
                        uuid: scoutReportUuid
                    },
                    action: "AUTO_LEAVE",
                    time:
                    {
                        lte: timeMax,
                        gte: timeMin
                    },
                }
            })


            return match._count._all

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
                        uuid: scoutReportUuid

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
            if (!eventsAverage) {
                eventsAverage = 0
            }
            //adds endgame points if nessisary
            if (metric1 === Metric.totalPoints) {
                const element = await prismaClient.scoutReport.findUnique({
                    where:
                    {
                        uuid: scoutReportUuid
                    }
                })
                let stagePoints = BargeResultPointMap[element.bargeResult]
                if (!stagePoints) {
                    stagePoints = 0
                }
                return eventsAverage + stagePoints
            }
            else {
                return eventsAverage
            }
        }

        else {
            let position = undefined
            let action = null
            switch (metric1) {
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
                case Metric.netScores:
                    action = EventAction.SCORE_NET
                    break;
                case Metric.netFails:
                    action = EventAction.FAIL_NET
                    break;
                case Metric.algaeDrops:
                    action = EventAction.DROP_ALGAE
                    break;
                case Metric.coralDrops:
                    action = EventAction.DROP_CORAL
                    break;
                case Metric.processorScores:
                    action = EventAction.SCORE_PROCESSOR
                    break;
                default:
                    action = metricToEvent[metric1] || undefined
                    position = undefined
                    break;
            }

            const match = await prismaClient.event.aggregate({
                _count:
                {
                    _all: true
                },
                where:
                {
                    scoutReport: {
                        uuid: scoutReportUuid
                    },
                    action: action,
                    position: position,
                    time:
                    {
                        lte: timeMax,
                        gte: timeMin
                    },
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