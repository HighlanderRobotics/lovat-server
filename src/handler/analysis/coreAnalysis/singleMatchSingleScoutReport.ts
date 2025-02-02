import prismaClient from '../../../prismaClient'
import { matchTimeEnd, Metric } from "../analysisConstants";
import { EventAction, Position, User } from "@prisma/client";
import { BargeResultPointMap } from '../../manager/managerConstants';


export const singleMatchSingleScoutReport = async (user: User, isPointAverage: boolean, scoutReportUuid: string, metric1: Metric, timeMin = 0, timeMax: number = matchTimeEnd): Promise<number> => {
    try {
        let position = null
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
            case Metric.feeds:
                action = EventAction.FEED
                position = Position.NONE
            default:
                position = Position.NONE
                break;
        }

        // const params = z.object({
        //     matchKey: z.string(),
        //     //metric enums are same as allMetrics
        //     metric: z.enum(["totalpoints", "driverability", "teleoppoints", "autopoints", "pickups", "ampscores", "speakerscores", "trapscores", "stage", "cooperation"])
        // }).safeParse({
        //     matchKey: matchKey,
        //     metric: metric1
        // })
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
        //     if (metric1 === Metric.netScores) {
        //         const match = await prismaClient.event.aggregate({
        //             _count:
        //             {
        //                 _all: true
        //             },
        //             where:
        //             {
        //                 scoutReport: {
        //                     uuid: scoutReportUuid
        //                 },
        //                 action: "SCORE_NET",
        //                 time:
        //                 {
        //                     lte: timeMax,
        //                     gte: timeMin
        //                 },
        //             }
        //         })
        //     }
        //     else if (metric1 === Metric.coralL1) {
        //         const match = await prismaClient.event.aggregate({
        //             _count:
        //             {
        //                 _all: true
        //             },
        //             where:
        //             {
        //                 scoutReport: {
        //                     uuid: scoutReportUuid
        //                 },
        //                 action: "SCORE_CORAL",
        //                 position: "LEVEL_ONE",
        //                 time:
        //                 {
        //                     lte: timeMax,
        //                     gte: timeMin
        //                 },
        //             }
        //         })
        //     }
        //     else if (metric1 === Metric.coralL2) {
        //         const match = await prismaClient.event.aggregate({
        //             _count:
        //             {
        //                 _all: true
        //             },
        //             where:
        //             {
        //                 scoutReport: {
        //                     uuid: scoutReportUuid
        //                 },
        //                 action: "SCORE_CORAL",
        //                 position: "LEVEL_TWO",
        //                 time:
        //                 {
        //                     lte: timeMax,
        //                     gte: timeMin
        //                 },
        //             }
        //         })
        //         return match._count._all

        //     }
        //     else if (metric1 === Metric.coralL3) {
        //         const match = await prismaClient.event.aggregate({
        //             _count:
        //             {
        //                 _all: true
        //             },
        //             where:
        //             {
        //                 scoutReport: {
        //                     uuid: scoutReportUuid
        //                 },
        //                 action: "SCORE_CORAL",
        //                 position: "LEVEL_THREE",
        //                 time:
        //                 {
        //                     lte: timeMax,
        //                     gte: timeMin
        //                 },
        //             }
        //         })
        //         return match._count._all

        //     }
        //     else if (metric1 === Metric.coralL4) {
        //         const match = await prismaClient.event.aggregate({
        //             _count:
        //             {
        //                 _all: true
        //             },
        //             where:
        //             {
        //                 scoutReport: {
        //                     uuid: scoutReportUuid
        //                 },
        //                 action: "SCORE_CORAL",
        //                 position: "LEVEL_FOUR",
        //                 time:
        //                 {
        //                     lte: timeMax,
        //                     gte: timeMin
        //                 },
        //             }
        //         })
        //         return match._count._all

        //     }
        //     if (metric1 === Metric.processorScores) {
        //         const match = await prismaClient.event.aggregate({
        //             _count:
        //             {
        //                 _all: true
        //             },
        //             where:
        //             {
        //                 scoutReport: {
        //                     uuid: scoutReportUuid
        //                 },
        //                 action: "SCORE_PROCESSOR",

        //                 time:
        //                 {
        //                     lte: timeMax,
        //                     gte: timeMin
        //                 },
        //             }
        //         })
        //         return match._count._all
        //     }

        //     if (metric1 === Metric.algaePickups) {
        //     const match = await prismaClient.event.aggregate({
        //         _count:
        //         {
        //             _all: true
        //         },
        //         where:
        //         {
        //             scoutReport: {
        //                 uuid: scoutReportUuid
        //             },
        //             action: "PICKUP_ALGAE",
        //             time:
        //             {
        //                 lte: timeMax,
        //                 gte: timeMin
        //             },
        //         }
        //     })

        //     return match._count._all
        // }
        // if (metric1 === Metric.coralPickups) {
        //     const match = await prismaClient.event.aggregate({
        //         _count:
        //         {
        //             _all: true
        //         },
        //         where:
        //         {
        //             scoutReport: {
        //                 uuid: scoutReportUuid
        //             },
        //             action: "PICKUP_CORAL",
        //             time:
        //             {
        //                 lte: timeMax,
        //                 gte: timeMin
        //             },
        //         }
        //     })

        //     return match._count._all
        // }
        // if (metric1 === Metric.algaeDrops) {
        //     const match = await prismaClient.event.aggregate({
        //         _count:
        //         {
        //             _all: true
        //         },
        //         where:
        //         {
        //             scoutReport: {
        //                 uuid: scoutReportUuid
        //             },
        //             action: "DROP_ALGAE",
        //             time:
        //             {
        //                 lte: timeMax,
        //                 gte: timeMin
        //             },
        //         }
        //     })

        //     return match._count._all
        // }
        // if (metric1 === Metric.coralDrops) {
        //     const match = await prismaClient.event.aggregate({
        //         _count:
        //         {
        //             _all: true
        //         },
        //         where:
        //         {
        //             scoutReport: {
        //                 uuid: scoutReportUuid
        //             },
        //             action: "DROP_CORAL",
        //             time:
        //             {
        //                 lte: timeMax,
        //                 gte: timeMin
        //             },
        //         }
        //     })

        //     return match._count._all
        // }
        // if (metric1 === Metric.netFails) {
        //     const match = await prismaClient.event.aggregate({
        //         _count:
        //         {
        //             _all: true
        //         },
        //         where:
        //         {
        //             scoutReport: {
        //                 uuid: scoutReportUuid
        //             },
        //             action: "FAIL_NET",
        //             time:
        //             {
        //                 lte: timeMax,
        //                 gte: timeMin
        //             },
        //         }
        //     })

        //     return match._count._all
        // }
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