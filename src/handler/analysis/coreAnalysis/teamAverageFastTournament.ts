import prismaClient from '../../../prismaClient'
import { matchTimeEnd, Metric, metricToEvent, swrConstant, ttlConstant } from "../analysisConstants";
import { EventAction, HighNoteResult, Position, StageResult, User } from "@prisma/client";


export const teamAverageFastTournament = async (user: User, team: number, isPointAverage: boolean, metric1: Metric, tournamentKey: string, timeMin = 0, timeMax: number = matchTimeEnd): Promise<number> => {
    try {
        let position = null
        switch (metric1) {
            case Metric.ampscores:
                position = Position.AMP
                break;
            case Metric.speakerscores:
                position = Position.SPEAKER
                break;
            case Metric.trapscores:
                position = Position.TRAP
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

        if (metric1 === Metric.pickups) {
            // Returns average pickups per scout report
            const counts = await prismaClient.event.groupBy({
                cacheStrategy :
                {
                    swr : swrConstant,
                    ttl : ttlConstant,
                },
                by: ["scoutReportUuid"],
                _count:
                {
                    _all: true
                },
                where:
                {
                    scoutReport: scoutReportFilter,
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
        else if (metric1 === Metric.driverability) {
            // Returns average driverAbility per scout report
            const driverAbilityAvg = await prismaClient.scoutReport.aggregate({
                cacheStrategy :
                {
                    swr : swrConstant,
                    ttl : ttlConstant,
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
            if (metric1 !== Metric.totalpoints && metric1 !== Metric.teleoppoints) {
                return eventsAverage;
            }

            /**********
             STAGE
             **********/
            const stageRows = await prismaClient.scoutReport.groupBy({
                cacheStrategy:
                {
                    swr: swrConstant,
                    ttl: ttlConstant,
                },
                by: ['stage'],
                _count: {
                    stage: true,
                },
                where: scoutReportFilter,
            });

            // Count of reports by stage result
            const stageDataMap: Partial<Record<StageResult, number>> = {}
            stageRows.forEach(row => {
                stageDataMap[row.stage] = row._count.stage;
            });

            // Count of stage interactions
            const stageAttempts = stageRows.reduce((total, row) => {
                if (row.stage !== StageResult.NOTHING) {
                    return total + row._count.stage;
                }
                return total;
            }, 0);

            // Average stage points, excluding non-attempts
            let avgStagePoints = 0
            if (stageAttempts !== 0) {
                avgStagePoints = (((stageDataMap[StageResult.ONSTAGE] || 0) * 3) +
                    ((stageDataMap[StageResult.ONSTAGE_HARMONY] || 0) * 5) +
                    ((stageDataMap[StageResult.PARK] || 0))) / stageAttempts;
            }

            /**********
             HIGH NOTE
             **********/
            const highNoteRows = await prismaClient.scoutReport.groupBy({
                by: ['highNote'],
                _count: {
                    highNote: true,
                },
                where: scoutReportFilter
            });

            // Count of high note interactions
            const highNoteAttempts = highNoteRows.reduce((total, item) => {
                if (item.highNote !== HighNoteResult.NOT_ATTEMPTED) {
                    return total + item._count.highNote;
                }
                return total;
            }, 0);

            // Average high note points
            let avgHighNotePoints = highNoteRows.find(row => row.highNote = HighNoteResult.SUCCESSFUL)._count.highNote / highNoteAttempts;
            if (!isFinite(avgHighNotePoints)) {
                avgHighNotePoints = 0;
            }

            return eventsAverage + avgHighNotePoints + avgStagePoints;
        }
        else if (metric1 === Metric.scores) {
            // Returns average scores per scout report
            const groupedMatches = await prismaClient.event.groupBy({
                cacheStrategy :
                {
                    swr : swrConstant,
                    ttl : ttlConstant,
                },
                by: ["scoutReportUuid"],
                _count:
                {
                    _all: true
                },
                where:
                {
                    scoutReport: scoutReportFilter,
                    action: EventAction.SCORE,
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
        else {
            // Returns average of given EventAction per scout report

            // Attempt to convert metric to an EventAction
            const metric = metricToEvent[metric1];
            if (!(metric in EventAction)) {
                throw "Metric failed conversion to event action";
            };

            const groupedMatches = await prismaClient.event.groupBy({
                cacheStrategy :
                {
                    swr : swrConstant,
                    ttl : ttlConstant,
                },
                by: ["scoutReportUuid"],
                _count:
                {
                    _all: true
                },
                where:
                {
                    scoutReport: scoutReportFilter,
                    action: metric,
                    time:
                    {
                        lte: timeMax,
                        gte: timeMin
                    },
                    position: position
                }
            })

            let avg = groupedMatches.reduce((accumulator, current) => {
                return accumulator + current._count._all;
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