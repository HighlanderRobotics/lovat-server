import prismaClient from '../../../prismaClient'
import { allTournaments, autoEnd, endgameToPoints, Metric, metricToEvent, swrConstant, ttlConstant } from "../analysisConstants";
import { BargeResult, Position, Prisma } from '@prisma/client';
import { endgameRuleOfSuccession } from '../picklist/endgamePicklistTeamFast';
import { Event } from '@prisma/client';

export interface ArrayFilter<T> { notIn?: T[], in?: T[] };

// Compute AATF on multiple teams at once, returning results in multiple sparse arrays by team number
// Hopefully better performance for picklists
export const arrayAndAverageManyFast = async (metrics: Metric[], teams: number[], sourceTeamFilter: ArrayFilter<number>, sourceTournamentFilter: ArrayFilter<string>): Promise<Partial<Record<Metric, { average: number }[]>>> => {
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
                srEvents: Partial<Event>[][],
                driverAbility: number[],
                bargePoints: number[]
            }[],
            endgame: {
                resultCount: Partial<Record<BargeResult, number>>,
                totalAttempts: number
            }
        };

        const rawDataGrouped = new Array<GroupedData>;
        // Initialize array beforehand to avoid errors if user settings result in no sourced scout reports for a team
        for (const team of teams) {
            rawDataGrouped[team] ||= { tournamentData: [], endgame: { resultCount: {}, totalAttempts: 0 } };
        }

        // Group into team => tournament (newest first) => data by scout report
        const tournamentIndexMap = await allTournaments;
        tmd.forEach(val => {
            const currRow = rawDataGrouped[val.teamNumber]
            const ti = tournamentIndexMap.indexOf(val.tournamentKey);
            currRow.tournamentData[ti] ||= { srEvents: [], driverAbility: [], bargePoints: [] };

            // Push data in
            for (const sr of val.scoutReports) {
                const currRowTournament = currRow.tournamentData[ti];
                currRowTournament.srEvents.push(sr.events);
                currRowTournament.driverAbility.push(sr.driverAbility);
                currRowTournament.bargePoints.push(endgameToPoints[sr.bargeResult]);

                // Add endgame data
                if (metrics.includes(Metric.bargePoints) && sr.bargeResult !== BargeResult.NOT_ATTEMPTED) {
                    currRow.endgame.totalAttempts++;
                    currRow.endgame.resultCount[sr.bargeResult] ||= 0;
                    currRow.endgame.resultCount[sr.bargeResult]++;
                }
            }
        });

        // In case multiple point counts are considered
        const teleopPoints: number[][] = [];
        const autoPoints: number[][] = [];

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
                    rawDataGrouped[team].tournamentData.forEach(tournament => {
                        resultsByTournament[team].push(avgOrZero(tournament.driverAbility))
                    });
                }
            } else if (metric === Metric.totalPoints || metric === Metric.teleopPoints || metric === Metric.autoPoints) {
                if (teleopPoints.length === 0 && (metric === Metric.totalPoints || metric === Metric.teleopPoints)) {
                    for (const team of teams) {
                        // Generic average if no reusable data is available
                        teleopPoints[team] = [];
                        rawDataGrouped[team].tournamentData.forEach(tournament => {
                            const timedEvents = tournament.srEvents.map(val => val.filter(e => e.time > autoEnd)) || [];
                            const pointSumsByReport = []
                            timedEvents.forEach((events, i) => {
                                // Push sum of event points and endgame
                                pointSumsByReport.push(events.reduce((acc, cur) => acc + cur.points, 0) + tournament.bargePoints[i]);
                            });

                            teleopPoints[team].push(avgOrZero(pointSumsByReport));
                        });
                    }
                }
                if (autoPoints.length === 0 && (metric === Metric.totalPoints || metric === Metric.autoPoints)) {
                    if (autoPoints.length === 0) {
                        for (const team of teams) {
                            // Generic average if no reusable data is available
                            autoPoints[team] = [];
                            rawDataGrouped[team].tournamentData.forEach(tournament => {
                                const timedEvents = tournament.srEvents.map(val => val.filter(e => e.time <= autoEnd));
                                const pointSumsByReport = timedEvents.map(e => e.reduce((acc, cur) => acc + cur.points, 0));

                                autoPoints[team].push(avgOrZero(pointSumsByReport));
                            });
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
                    rawDataGrouped[team].tournamentData.forEach(tournament => {
                        // Count and push metrics by action/position
                        let countAtTournament = 0;

                        tournament.srEvents.forEach(sr => {
                            sr.forEach(event => {
                                if (event.action === action && event.position === position) {
                                    countAtTournament++;
                                }
                            });
                        });

                        // Push average metric count by tournament
                        resultsByTournament[team].push(countAtTournament / tournament.srEvents.length);
                    });
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
    let result = 0

    for (let i = values.length - 1; i >= 0; i--) {
        if (i === values.length - 1) {
            // Initialize with furthest tournament
            result = values[i]
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