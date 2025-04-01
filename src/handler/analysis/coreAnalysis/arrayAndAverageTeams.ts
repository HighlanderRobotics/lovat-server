import prismaClient from '../../../prismaClient'
import { allTeamNumbers, allTournaments, autoEnd, endgameToPoints, Metric, metricToEvent, swrConstant, ttlConstant } from "../analysisConstants";
import { endgamePicklistTeamFast } from "../picklist/endgamePicklistTeamFast";
import { Event, Position, Prisma, ScoutReport, User } from "@prisma/client";
import { getSourceFilter } from './arrayAndAverageManyFast';

/**
 * Accurately aggregate an analog metric on multiple teams at once (weighs matches equally regardless of extra scout reports).
 * Provides a timeline of metric counts per match.
 * Optimized for use over a few teams.
 *
 * @param teams teams to look at
 * @param metric metrics to aggregate by
 * @param user source teams/tournaments to use
 * @returns object of predicted points and match timeline organized by team number. All teams are expected to be in this object
 */
export const arrayAndAverageTeams = async (teams: number[], metric: Metric, user: User): Promise<Record<number, { average: number, timeLine: { match: string, dataPoint: number }[] }>> => {
    try {
        const sourceTnmtFilter = getSourceFilter(user.tournamentSource, await allTournaments);
        const sourceTeamFilter = getSourceFilter(user.teamSource, await allTeamNumbers);

        // Endgame point prediction
        if (metric === Metric.bargePoints) {
            const result = {};

            for (const team of teams) {
                result[team] = { average: await endgamePicklistTeamFast(team, sourceTeamFilter, sourceTnmtFilter), timeLine: null };
            }

            return result;
        }

        // Data and aggregation based on metric
        let srSelect: Prisma.ScoutReportSelect = null;
        let matchAggregationFunction: (reports: Partial<ScoutReport & { events: Event[] }>[]) => number = null;

        switch (metric) {
            case Metric.driverAbility:
                srSelect = { driverAbility: true };
                matchAggregationFunction = (reports) => {
                    return reports.reduce((acc, cur) => acc + cur.driverAbility, 0) / reports.length;
                };
                break;

            case Metric.totalPoints:
                srSelect = {
                    events: { select: { points: true } },
                    bargeResult: true
                };
                matchAggregationFunction = (reports) => {
                    let total = 0;
                    reports.forEach(sr => {
                        sr.events.forEach(e => {
                            total += e.points;
                        });
                        total += endgameToPoints[sr.bargeResult];
                    });
                    return total / reports.length;
                };
                break;

            case Metric.teleopPoints:
                srSelect = {
                    events: {
                        where: { time: { gt: autoEnd } },
                        select: { points: true }
                    },
                    bargeResult: true
                };
                matchAggregationFunction = (reports) => {
                    let total = 0;
                    reports.forEach(sr => {
                        sr.events.forEach(e => {
                            total += e.points;
                        });
                    });
                    return total / reports.length;
                };
                break;

            case Metric.autoPoints:
                srSelect = {
                    events: {
                        where: { time: { lte: autoEnd } },
                        select: { points: true }
                    }
                };
                matchAggregationFunction = (reports) => {
                    let total = 0;
                    reports.forEach(sr => {
                        sr.events.forEach(e => {
                            total += e.points;
                        });
                    });
                    return total / reports.length;
                };
                break;

            default:
                const action = metricToEvent[metric];
                let position: Position = null;
                switch (metric) {
                    case Metric.coralL1:
                        position = Position.LEVEL_ONE;
                        break;
                    case Metric.coralL2:
                        position = Position.LEVEL_TWO;
                        break;
                    case Metric.coralL3:
                        position = Position.LEVEL_THREE;
                        break;
                    case Metric.coralL4:
                        position = Position.LEVEL_FOUR;
                        break;
                }

                if (position === null) {
                    srSelect = {
                        events: {
                            where: { action: action },
                            select: { eventUuid: true }
                        }
                    };
                } else {
                    srSelect = {
                        events: {
                            where: {
                                action: action,
                                position: position
                            },
                            select: { eventUuid: true }
                        }
                    };
                }

                matchAggregationFunction = (reports) => {
                    let total = 0;
                    reports.forEach(sr => {
                        total += sr.events.length;
                    });
                    return total / reports.length;
                };
                break;
        }

        // Finish setting up filters to decrease server load
        const tmdFilter: Prisma.TeamMatchDataWhereInput = { teamNumber: { in: teams } };
        if (sourceTnmtFilter) {
            tmdFilter.tournamentKey = sourceTnmtFilter;
        }
        const srFilter: Prisma.ScoutReportWhereInput = {};
        if (sourceTeamFilter) {
            srFilter.scouter = {
                sourceTeamNumber: sourceTeamFilter
            };
        }

        // Main query
        const tmd = await prismaClient.teamMatchData.findMany({
            cacheStrategy: {
                swr: swrConstant,
                ttl: ttlConstant,
            },
            where: tmdFilter,
            select: {
                tournamentKey: true,
                key: true,
                teamNumber: true,
                scoutReports: {
                    where: srFilter,
                    select: srSelect
                },
            },
            orderBy: [
                // Ordered by oldest first
                {
                    tournament: {
                        date: 'asc'
                    }
                },
                { matchType: "asc" },
                { matchNumber: "asc" },
            ]
        });

        // Organized as team number => tournament => list of avg driver ability per match
        const matchGroups: Record<number, { match: string, dataPoint: number }[][]> = {};
        for (const team of teams) {
            matchGroups[team] = [];
        }

        // Group TMD by matches
        let currTournament = "";
        let tournamentIndex = -1;
        for (const curMatch of tmd) {
            if (curMatch.tournamentKey !== currTournament) {
                currTournament = curMatch.tournamentKey;
                tournamentIndex++;
                matchGroups[curMatch.teamNumber][tournamentIndex] = [];
            }

            // Aggregate according to metric
            const matchAvg = matchAggregationFunction(curMatch.scoutReports);
            matchGroups[curMatch.teamNumber][tournamentIndex].push({ match: curMatch.key, dataPoint: matchAvg });
        }

        // Push timelines and aggregate final result
        const result: Record<number, { average: number, timeLine: { match: string, dataPoint: number }[] }> = {};
        for (const team of teams) {
            result[team] = { average: null, timeLine: [] };
            const tournamentGroups = [];

            // Push timelines and aggregate by tournament
            matchGroups[team].forEach(tournament =>{
                result[team].timeLine.push(...tournament);
                tournamentGroups.push(tournament.reduce((acc, cur) => acc + cur.dataPoint, 0) / tournament.length);
            });

            // Weighted average for final result
            result[team].average = weightedTourAvgLeft(tournamentGroups);
        }

        return result;
    }
    catch (error) {
        console.error(error)
        throw (error)
    }

};

export function avgOrZero(values: number[]): number {
    return (values.reduce((acc, cur) => acc + cur, 0) / values.length) || 0;
}

// Most recent is last
export function weightedTourAvgLeft(values: number[]): number {
    let result = 0

    for (let i = 0; i < values.length; i++) {
        if (i === 0) {
            // Initialize with furthest tournament
            result = values[0];
        // } else if (i === 0) {
        //     // Dynamic weighting for most recent tournament
        //     const weightOnRecent = 0.95 * (1 - (1 / (multiplerBaseAnalysis + 1)));
        //     result = result * (1 - weightOnRecent) + values[i] * weightOnRecent;
        } else {
            // Use default weights
            result = result * 0.2 + values[i] * 0.8;
        }
    }

    return result;
}