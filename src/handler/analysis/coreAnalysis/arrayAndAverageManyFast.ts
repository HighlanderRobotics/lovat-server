import prismaClient from '../../../prismaClient'
import { allTournaments, autoEnd, endgameToPoints, Metric, metricToEvent, swrConstant, ttlConstant } from "../analysisConstants";
import { BargeResult, Position, Prisma, User } from '@prisma/client';
import { endgamePicklistTeamFast, endgameRuleOfSuccession } from '../picklist/endgamePicklistTeamFast';
import { Event } from '@prisma/client';

export interface ArrayFilter<T> { notIn?: T[], in?: T[] };

// Compute AATF on multiple teams at once, returning results in multiple sparse arrays by team number
// Hopefully better performance for picklists
export const arrayAndAverageManyFast = async (user: User, metrics: Metric[], teams: number[], sourceTeamFilter: ArrayFilter<number>, sourceTournamentFilter: ArrayFilter<string>): Promise<Partial<Record<Metric, { average: number }[]>>> => {
    try {
        // Set up filters to decrease server load
        const tmdFilter: Prisma.TeamMatchDataWhereInput = { teamNumber: { in: teams } };
        if (sourceTournamentFilter) {
            tmdFilter.tournamentKey = sourceTournamentFilter;
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
                teamNumber: true,
                scoutReports: {
                    where: srFilter,
                    select: {
                        events: {
                            select: {
                                action: true,
                                position: true,
                                points: true,
                                time: true
                            }
                        },
                        driverAbility: true,
                        bargeResult: true
                    }
                },
            }
        });

        // Sparse array by team number
        interface GroupedData { 
            // Sparse array by tournament date
            tournamentData: {
                // By scout report
                events: Partial<Event>[][],
                driverAbility: number[],
                bargePoints: number[]
            }[],
            endgame: {
                resultCount: Partial<Record<BargeResult, number>>,
                totalAttempts: number
            }
        };

        // Group into team => tournament (newest first) => data by scout report
        const tournamentIndexMap = await allTournaments;
        const rawDataGrouped: GroupedData[] = tmd.reduce((acc, cur) => {
            const ti = tournamentIndexMap.indexOf(cur.tournamentKey);
            acc[cur.teamNumber] ||= { tournamentData: [], endgame: { resultCount: {}, totalAttempts: 0 } };
            acc[cur.teamNumber].tournamentData[ti] ||= { events: [], driverAbility: [], bargePoints: [] };

            // Push data in
            for (const sr of cur.scoutReports) {
                acc[cur.teamNumber].tournamentData[ti].events.push(sr.events);
                acc[cur.teamNumber].tournamentData[ti].driverAbility.push(sr.driverAbility);
                acc[cur.teamNumber].tournamentData[ti].bargePoints.push(endgameToPoints[sr.bargeResult]);

                // Add endgame data
                if (metrics.includes(Metric.bargePoints) && sr.bargeResult !== BargeResult.NOT_ATTEMPTED) {
                    acc[cur.teamNumber].endgame.totalAttempts++;
                    acc[cur.teamNumber].endgame.resultCount[sr.bargeResult] ||= 0;
                    acc[cur.teamNumber].endgame.resultCount[sr.bargeResult]++;
                }
            }

            return acc;
        }, [] as typeof rawDataGrouped);

        // In case multiple point counts are considered
        let teleopPoints: number[][] = [];
        let autoPoints: number[][] = [];

        const finalResults: Partial<Record<Metric, { average: number }[]>> = {};
        for (const metric of metrics) {
            // Team => tournament => average value of metric
            let resultsByTournament: number[][] = [];

            if (metric === Metric.bargePoints) {
                finalResults[metric] = [];
                for (const team of teams) {
                    // Using rule of succession for endgame
                    finalResults[metric][team] = { average: endgameRuleOfSuccession(rawDataGrouped[team].endgame.resultCount, rawDataGrouped[team].endgame.totalAttempts) };
                }
                continue;
            } else if (metric === Metric.driverAbility) {
                for (const team of teams) {
                    // Generic average for driverAbilities
                    resultsByTournament[team] = [];
                    for (const tournament of rawDataGrouped[team].tournamentData) {
                        if (tournament) {
                            resultsByTournament[team].push(avgOrZero(tournament.driverAbility))
                        }
                    }
                }
            } else if (metric === Metric.totalPoints || metric === Metric.teleopPoints || metric === Metric.autoPoints) {
                if (teleopPoints.length === 0 && (metric === Metric.totalPoints || metric === Metric.teleopPoints)) {
                    for (const team of teams) {
                        // Generic average if no reusable data is available
                        teleopPoints[team] = [];
                        for (const tournament of rawDataGrouped[team].tournamentData) {
                            if (tournament) {
                                const timedEvents = tournament.events.map(val => val.filter(e => e.time > autoEnd)) || [];
                                const pointSumsByReport = []
                                timedEvents.forEach((events, i) => {
                                    // Push sum of event points and endgame
                                    pointSumsByReport.push(events.reduce((acc, cur) => acc + cur.points, 0) + tournament.bargePoints[i]);
                                });

                                teleopPoints[team].push(avgOrZero(pointSumsByReport));
                            }
                        }
                    }
                }
                if (autoPoints.length === 0 && (metric === Metric.totalPoints || metric === Metric.autoPoints)) {
                    if (autoPoints.length === 0) {
                        for (const team of teams) {
                            // Generic average if no reusable data is available
                            autoPoints[team] = [];
                            for (const tournament of rawDataGrouped[team].tournamentData) {
                                if (tournament) {
                                    const timedEvents = tournament.events.map(val => val.filter(e => e.time <= autoEnd));
                                    const pointSumsByReport = timedEvents.map(e => e.reduce((acc, cur) => acc + cur.points, 0));

                                    autoPoints[team].push(avgOrZero(pointSumsByReport));
                                }
                            }
                        }
                    }
                    resultsByTournament = autoPoints;
                }

                if (metric === Metric.teleopPoints) {
                    resultsByTournament = teleopPoints;
                } else if (metric === Metric.autoPoints) {
                    resultsByTournament = autoPoints;
                } else {
                    resultsByTournament = teleopPoints.map((row, i) => row.map((cell, j) => cell + autoPoints[i][j]));
                }
            } else {
                // Average by count of metrics
                const action = metricToEvent[metric];
                let position: Position = Position.NONE;
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

                for (const team of teams) {
                    resultsByTournament[team] = [];
                    for (const tournament of rawDataGrouped[team].tournamentData) {
                        if (tournament) {
                            // Count and push metrics by action/position
                            resultsByTournament[team].push(tournament.events.reduce((totalCount, report) => {
                                return totalCount + report.reduce((count, cur) => {
                                    if (cur.action === action && cur.position === position) {
                                        return ++count;
                                    }
                                }, 0);
                            }, 0));
                        }
                    }
                }
            }

            // Weight by tournament, most recent tournaments get more
            finalResults[metric] = [];
            for (const team of teams) {
                finalResults[metric][team] = { average: weightedTourAvgRight(resultsByTournament[team]) };
            }
        }

        return finalResults;
    }
    catch (error) {
        console.log(error)
        throw (error)
    }

};

// Attempts to make filters more efficient
// Could still cause problems at tournaments, would have to be tested - failure should be treated by changing first condition to a tolderance
export const getSourceFilter = <T>(sources: T[], possibleSources: T[]): undefined | ArrayFilter<T> => {
    // If nothing is filtered, don't check
    if (sources.length === possibleSources.length) {
        return undefined;
    }

    // Many users will only filter a few out, invert takes advantage of this
    if (sources.length >= possibleSources.length * 0.7) {
        const unsourcedTeams = possibleSources.filter(val => !sources.includes(val));
        return { notIn: unsourcedTeams };
    }

    // Case where user only accepts data from some
    return { in: sources };
}

function avgOrZero(values: number[]): number {
    return (values.reduce((acc, cur) => acc + cur, 0) / values.length) || 0;
}

// Most recent is first
function weightedTourAvgRight(values: number[]): number {
    let result = values.at(-1);

    for (let i = values.length - 2; i >= 0; i--) {
        result = result * 0.2 + values[i] * 0.8;
    }

    return result;
}