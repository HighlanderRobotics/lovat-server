import prismaClient from '../../../prismaClient'
import { endgameToPoints, matchTimeEnd, Metric, metricToEvent, swrConstant, ttlConstant, allTeamNumbers } from "../analysisConstants";
import { EventAction, Position, User, Prisma} from "@prisma/client";



export const teamAverageFastTournament = async (user: User, team: number, isPointAverage: boolean, metric1: Metric, tournamentKey: string, timeMin = 0, timeMax: number = matchTimeEnd): Promise<number> => {
    try {
        // Could still cause problems at tournaments, would have to be tested - failure should be treated by changing first condition to a tolerance
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
        if (user.teamSource.length === (await allTeamNumbers).length) {
            // If no teams are filtered, don't check teams in prisma request
            scoutReportFilter = {
                teamMatchData:
                {
                    tournamentKey: tournamentKey,
                    teamNumber: team
                }
            }
        } else if (user.teamSource.length >= (await allTeamNumbers).length / 2) {
            // Many users will only filter a few teams, invert checks if this is the case for faster performance
            const unsourcedTeams = (await allTeamNumbers).filter(val => !user.teamSource.includes(val));
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
            const endgameRows = await prismaClient.scoutReport.groupBy({
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

            let endgamePoints = 0;
            // eslint-disable-next-line @typescript-eslint/prefer-for-of
            for (let i = 0; i < endgameRows.length; i++) {
                endgamePoints += endgameToPoints[endgameRows[i].bargeResult] * endgameRows[i]._count.bargeResult;
            }

            return eventsAverage + (endgamePoints / sumOfMatches.length);
        }
        else {
            // Returns average of given EventAction per scout report

            let position = undefined
            let action = undefined
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
                default:
                    action = metricToEvent[metric1] || undefined
                    position = undefined
                    break;
            }
            if (!(action || position)) {
                throw "Metric failed conversion to event action";
            };



            const groupedMatches = await prismaClient.$queryRaw<
              { scoutReportUuid: string; count: number }[]
            >(Prisma.sql`
              SELECT e."scoutReportUuid", COUNT(*) AS count
              FROM "Event" e
              JOIN "ScoutReport" sr ON sr."uuid" = e."scoutReportUuid"
              JOIN "TeamMatchData" tmd ON tmd."key" = sr."teamMatchKey"
              WHERE e."action"::text = ${action}
                AND e."position"::text = ${position}
                AND e."time" BETWEEN ${timeMin} AND ${timeMax}
                AND tmd."tournamentKey" = ${tournamentKey}
                AND tmd."teamNumber" = ${team}
              GROUP BY e."scoutReportUuid"
            `);
            
            if (groupedMatches.length === 0) {
                return 0;
              }
              
              const totalCount = groupedMatches.reduce((acc, curr) => acc + Number(curr.count), 0);
              const avg = totalCount / groupedMatches.length;
              return avg;
              
            
        }
    }
    catch (error) {
        console.error(error.error)
        throw (error)
    }

};