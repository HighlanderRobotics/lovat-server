import prismaClient from '../../../prismaClient'
import { allTeamNumbers, allTournaments, autoEnd, endgameToPoints, Metric, metricToEvent, swrConstant, ttlConstant } from "../analysisConstants";
import { endgamePicklistTeamFast } from "../picklist/endgamePicklistTeamFast";
import { Event, Position, Prisma, ScoutReport, User } from "@prisma/client";
import { getSourceFilter } from './averageManyFast';

// Could be changed to be SQL dependent. Might be slightly better for readability and performance, but would probably be harder to update each season, especially for newer members.

/**
 * Accurately aggregate an analog metric on multiple teams at once (weighs matches equally regardless of extra scout reports).
 * Provides a timeline of metric value per match.
 * Optimized to compare one metric over a few teams.
 *
 * @param teams teams to look at
 * @param metric metrics to aggregate by
 * @param user source teams/tournaments to use
 * @returns object of predicted points and match timeline organized by team number. All teams are expected to be in this object
 */
export const arrayAndAverageTeams = async (teams: number[], metric: Metric, user: User): Promise<Record<number, { average: number, timeLine: { match: string, dataPoint: number, tournamentName: string }[] }>> => {
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

        // Data and aggregation based on metric. Variables determine data requested and aggregation method
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
                // Generic event count
                const action = metricToEvent[metric];
                let position: Position = undefined;
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

                srSelect = {
                    events: {
                        where: {
                            action: action,
                            position: position
                        },
                        select: { eventUuid: true }
                    }
                };

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
                // There's gotta be some way to not have to send the tournamnet name through every time
                tournament: {
                    select: {
                        name: true
                    }
                },
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
                        date: "asc"
                    }
                },
                { teamNumber: "asc" },
                { matchType: "asc" },
                { matchNumber: "asc" },
            ]
        });

        // Organized as team number => tournament => list of avg /driver ability/event counts/points/ per match
        const matchGroups: Record<number, { match: string, dataPoint: number, tournamentName: string }[][]> = {};
        for (const team of teams) {
            matchGroups[team] = [];
        }

        // Group TMD by matches
        let tournamentIndex: Record<number, number> = {};
        let currTournament: string = null;
        let currTeam: number = null;
        for (const curMatch of tmd) {
            if (curMatch.tournamentKey !== currTournament || curMatch.teamNumber !== currTeam) {
                currTournament = curMatch.tournamentKey;
                currTeam = curMatch.teamNumber;
                // Increment or initialize team-specific array index
                tournamentIndex[currTeam] = tournamentIndex[currTeam] ? tournamentIndex[currTeam] + 1 : 0;
                matchGroups[currTeam][tournamentIndex[currTeam]] = [];
            }

            // Aggregate according to metric
            if (curMatch.scoutReports.length > 0) {
                const matchAvg = matchAggregationFunction(curMatch.scoutReports);
                matchGroups[currTeam][tournamentIndex[currTeam]].push({ match: curMatch.key, dataPoint: matchAvg, tournamentName: curMatch.tournament.name });
            }
        }

        // Push timelines and aggregate final result
        const result: Record<number, { average: number, timeLine: { match: string, dataPoint: number, tournamentName: string }[] }> = {};
        for (const team of teams) {
            result[team] = { average: null, timeLine: [] };
            const tournamentGroups = [];

            // Push timelines and aggregate by tournament
            matchGroups[team].forEach(tournament => {
                if (tournament.length > 0) {
                    result[team].timeLine.push(...tournament);
                    tournamentGroups.push(tournament.reduce((acc, cur) => acc + cur.dataPoint, 0) / tournament.length);
                }
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

// Most recent is last
export function weightedTourAvgLeft(values: number[]): number {
    let result = 0

    for (let i = 0; i < values.length; i++) {
        if (i === 0) {
            // Initialize with furthest tournament
            result = values[0];
        // } else if (i === 0) {
        //     // Dynamic weighting for most recent tournament
        //     const weightOnRecent = 0.95 * (1 - (1 / (multiplerBaseAnalysis * (scoutedAtMostRecent/totalAtMostRecent) + 1)));
        //     result = result * (1 - weightOnRecent) + values[i] * weightOnRecent;
        } else {
            // Use default weights
            result = result * 0.2 + values[i] * 0.8;
        }
    }

    return result;
}
