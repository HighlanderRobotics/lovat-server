import prismaClient from '../../../prismaClient'
import { matchTimeEnd, Metric, metricToEvent, swrConstant, ttlConstant } from "../analysisConstants";
import { BargeResult, EventAction, Position, User } from "@prisma/client";


export const teamAverageFastTournament = async (user: User, team: number, isPointAverage: boolean, metric1: Metric, tournamentKey: string, timeMin = 0, timeMax: number = matchTimeEnd): Promise<number> => {
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
            default:
                position = Position.NONE
                break;
        }

        // Could still cause problems at tournaments, would have to be tested - failure should be treated by changing first condition to a tolerance
        const allTeamNumbers = (await prismaClient.team.findMany()).map(team => team.number);
        let scoutReportFilter: {
            teamMatchData: {
                tournamentKey: string;
                teamNumber: number;
            }
            scouter?: {
                sourceTeamNumber:
                { notIn: number[] } | { in: number[] }
            }
        };

        // Variable stores scout report filter
        if (user.teamSource.length === allTeamNumbers.length) {
            // If no teams are filtered, don't check teams in prisma request
            scoutReportFilter = {
                teamMatchData:
                {
                    tournamentKey: tournamentKey,
                    teamNumber: team
                }
            }
        } else if (user.teamSource.length >= allTeamNumbers.length / 2) {
            // Many users will only filter a few teams, invert checks if this is the case for faster performance
            const unsourcedTeams = allTeamNumbers.filter(val => !user.teamSource.includes(val));
            scoutReportFilter = {
                teamMatchData:
                {
                    tournamentKey: tournamentKey,
                    teamNumber: team
                },
                scouter:
                {
                    sourceTeamNumber:
                    {
                        notIn: unsourcedTeams
                    }
                }
            }
        } else {
            // Case where user only accepts data from some teams
            scoutReportFilter = {
                teamMatchData:
                {
                    tournamentKey: tournamentKey,
                    teamNumber: team
                },
                scouter:
                {
                    sourceTeamNumber:
                    {
                        in: user.teamSource
                    }
                }
            }
        }

        if (metric1 === Metric.algaePickups) {
            // Returns average pickups per scout report
            const counts = await prismaClient.event.groupBy({
                cacheStrategy:
                {
                    swr: swrConstant,
                    ttl: ttlConstant,
                },
                by: ["scoutReportUuid"],
                _count:
                {
                    _all: true
                },
                where:
                {
                    scoutReport: scoutReportFilter,
                    action: EventAction.PICKUP_ALGAE,
                    time:
                    {
                        lte: timeMax,
                        gte: timeMin
                    },
                }
            })

            return counts.reduce((acc, cur) => acc + cur._count._all, 0) / counts.length;
        }
        else if (metric1 === Metric.coralPickups) {
            // Returns average pickups per scout report
            const counts = await prismaClient.event.groupBy({
                cacheStrategy:
                {
                    swr: swrConstant,
                    ttl: ttlConstant,
                },
                by: ["scoutReportUuid"],
                _count:
                {
                    _all: true
                },
                where:
                {
                    scoutReport: scoutReportFilter,
                    action: EventAction.PICKUP_CORAL,
                    time:
                    {
                        lte: timeMax,
                        gte: timeMin
                    },
                }
            })

            return counts.reduce((acc, cur) => acc + cur._count._all, 0) / counts.length;
        }
        else if (metric1 === Metric.driverAbility) {
            // Returns average driverAbility per scout report
            const driverAbilityAvg = await prismaClient.scoutReport.aggregate({
                cacheStrategy:
                {
                    swr: swrConstant,
                    ttl: ttlConstant,
                },
                _avg:
                {
                    driverAbility: true
                },
                where: scoutReportFilter
            })
            //avg could be multiple results from one scout
            let avg = driverAbilityAvg._avg.driverAbility
            if (!avg) {
                avg = 0
            }
            return avg
        }
        else if (isPointAverage) {
            // Returns average points for teleop and/or auto per scout report
            const sumOfMatches = await prismaClient.event.groupBy({
                cacheStrategy:
                {
                    swr: swrConstant,
                    ttl: ttlConstant,
                },
                by: ["scoutReportUuid"],
                _sum:
                {
                    points: true
                },
                where:
                {
                    scoutReport: scoutReportFilter,
                    time:
                    {
                        lte: timeMax,
                        gte: timeMin
                    }

                },
            })

            // Average points from events
            let eventsAverage = 0
            if (sumOfMatches.length > 0) {
                eventsAverage = sumOfMatches.reduce((acc, item) => acc + item._sum.points, 0) / sumOfMatches.length;
            }

            // Return if endgame points are not necessary
            if (metric1 !== Metric.totalPoints && metric1 !== Metric.teleopPoints) {
                return eventsAverage;
            }

            /**********
             BARGE
             **********/
            const bargeRows = await prismaClient.scoutReport.groupBy({
                cacheStrategy:
                {
                    swr: swrConstant,
                    ttl: ttlConstant,
                },
                by: ['bargeResult'],
                _count: {
                    bargeResult: true,
                },
                where: scoutReportFilter,
            });

            // Count of reports by stage result
            const stageDataMap: Partial<Record<BargeResult, number>> = {}
            bargeRows.forEach(row => {
                stageDataMap[row.bargeResult] = row._count.bargeResult;
            });

            // Count of stage interactions
            const stageAttempts = bargeRows.reduce((total, row) => {
                if (row.bargeResult !== BargeResult.NOT_ATTEMPTED) {
                    return total + row._count.bargeResult;
                }
                return total;
            }, 0);

            // Average stage points, excluding non-attempts
            // let avgStagePoints = 0
            // if (stageAttempts !== 0) {
            //     avgStagePoints = (((stageDataMap[StageResult.ONSTAGE] || 0) * 3) +
            //         ((stageDataMap[StageResult.ONSTAGE_HARMONY] || 0) * 5) +
            //         ((stageDataMap[StageResult.PARK] || 0))) / stageAttempts;
            // }
        }
        else {
            // Returns average of given EventAction per scout report

            // Attempt to convert metric to an EventAction
            const metric = metricToEvent[metric1];
            if (!(metric in EventAction)) {
                throw "Metric failed conversion to event action";
            };
            // Returns average scores per scout report

            const groupedMatches = await prismaClient.event.groupBy({
                cacheStrategy:
                {
                    swr: swrConstant,
                    ttl: ttlConstant,
                },
                by: ["scoutReportUuid"],
                _count:
                {
                    _all: true
                },
                where:
                {

                    action: action,
                    position: position,
                    time:
                    {
                        lte: timeMax,
                        gte: timeMin
                    },
                }
            })





            let avg = groupedMatches.reduce((acc, cur) => {
                return acc + cur._count._all;
            }, 0) / groupedMatches.length;
            if (!avg) {
                avg = 0
            }

            return avg
        }




    }
    catch (error) {
        console.error(error.error)
        throw (error)
    }

};