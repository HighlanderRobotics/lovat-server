import prismaClient from '../../../prismaClient'
import { allTeamNumbers, allTournaments, autoEnd, defaultEndgamePoints, endgameToPoints, Metric, metricToEvent } from "../analysisConstants";
import { Position, Prisma, User } from "@prisma/client";
import { getSourceFilter } from './averageManyFast';

/**
 * Heuristically aggregate an analog metric on all teams simultaneously (weights scout reports equally regardless of duplicate matches).
 *
 * @param metrics metrics to aggregate by
 * @param user source teams/tournaments to use
 * @returns predicted points
 */
export const averageAllTeamFast = async (metric: Metric, user: User): Promise<number> => {
    try {
        // Right off the bat, this is moot
        if (metric === Metric.bargePoints) {
            return defaultEndgamePoints;
        }

        const sourceTnmtFilter = getSourceFilter(user.tournamentSource, await allTournaments);
        const sourceTeamFilter = getSourceFilter(user.teamSource, await allTeamNumbers);

        // Average driver ability across all valid scout reports
        if (metric === Metric.driverAbility) {
            const data = await prismaClient.scoutReport.aggregate({
                _avg: {
                    driverAbility: true
                },
                where: {
                    teamMatchData: {
                        tournamentKey: sourceTnmtFilter
                    },
                    scouter: {
                        sourceTeamNumber: sourceTeamFilter
                    }
                }
            });

            return data._avg.driverAbility;
        }

        // Sum points and average across all valid scout reports
        if (metric === Metric.teleopPoints || metric === Metric.autoPoints || metric === Metric.totalPoints) {
            let timeFilter: Prisma.IntFilter = undefined;
            if (metric === Metric.autoPoints) {
                timeFilter = { lte: autoEnd };
            } else if (metric === Metric.teleopPoints) {
                timeFilter = { gt: autoEnd };
            }

            const data = await prismaClient.event.groupBy({
                by: "scoutReportUuid",
                _sum: {
                    points: true
                },
                where: {
                    scoutReport: {
                        teamMatchData: {
                            tournamentKey: sourceTnmtFilter
                        },
                        scouter: {
                            sourceTeamNumber: sourceTeamFilter
                        }
                    },
                    time: timeFilter
                }
            });

            if (data.length === 0) {
                return 0;
            }

            const avgMatchPoints = data.reduce((acc, cur) => acc + cur._sum.points, 0) / data.length;

            // Add endgame points if necessary
            let avgEndgamePoints = 0
            if (metric === Metric.totalPoints) {
                const bargeResults = await prismaClient.scoutReport.groupBy({
                    by: "bargeResult",
                    _count: {
                        _all: true
                    },
                    where: {
                        teamMatchData: {
                            tournamentKey: sourceTnmtFilter
                        },
                        scouter: {
                            sourceTeamNumber: sourceTeamFilter
                        }
                    }
                });

                bargeResults.forEach(endgame => {
                    avgEndgamePoints += endgameToPoints[endgame.bargeResult] * endgame._count._all;
                });

                avgEndgamePoints /= bargeResults.reduce((acc, cur) => acc + cur._count._all, 0);
            }

            return avgMatchPoints + avgEndgamePoints;
        }

        // Generic event count
        const action = metricToEvent[metric];
        let position: Position = undefined;
        switch (metric) {
            case Metric.coralL1:
                position = Position.LEVEL_ONE
                break;
            case Metric.coralL2:
                position = Position.LEVEL_TWO
                break;
            case Metric.coralL3:
                position = Position.LEVEL_THREE
                break;
            case Metric.coralL4:
                position = Position.LEVEL_FOUR
                break;
        }

        const data = await prismaClient.event.groupBy({
            by: "scoutReportUuid",
            _count: {
                _all: true
            },
            where: {
                scoutReport: {
                    teamMatchData: {
                        tournamentKey: sourceTnmtFilter
                    },
                    scouter: {
                        sourceTeamNumber: sourceTeamFilter
                    }
                },
                action: action,
                position: position
            }
        });

        // Return average, default to 0
        const avgCount = data.reduce((acc, cur) => acc + cur._count._all, 0) / data.length;
        return avgCount || 0;
    }
    catch (error) {
        console.error(error)
        throw (error)
    }

};