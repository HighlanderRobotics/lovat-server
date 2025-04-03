import prismaClient from '../../../prismaClient'
import { allTeamNumbers, allTournaments, autoEnd, endgameToPoints, Metric, metricToEvent, swrConstant, ttlConstant } from "../analysisConstants";
import { BargeResult, Position, Prisma, User } from '@prisma/client';
import { endgameRuleOfSuccession } from '../picklist/endgamePicklistTeamFast';
import { Event } from '@prisma/client';
import { avgOrZero, weightedTourAvgLeft } from './arrayAndAverageTeams';

export interface ArrayFilter<T> { notIn?: T[], in?: T[] };

/**
 * Heuristically aggregate analog metrics on multiple teams at once (weights scout reports equally regardless of duplicate matches).
 * Optimized for use with various types of continuous metrics (driver ability; endgame points; event counts; scores) over a large number of teams.
 *
 * @param teams teams to look at
 * @param metrics metrics to aggregate by
 * @param user source teams/tournaments to use
 * @returns object of predicted points organized by metric => team number => predicted points. All provided metrics and teams are expected to be in this object
 */
export const averageManyFast = async (teams: number[], metrics: Metric[], user: User): Promise<Partial<Record<Metric, Record<number, number>>>> => {
    try {
        // Set up filters to decrease server load
        const sourceTnmtFilter = getSourceFilter(user.tournamentSource, await allTournaments);
        const sourceTeamFilter = getSourceFilter(user.teamSource, await allTeamNumbers);

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
                endgamePoints: number[]
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
        // This map dictates order of tournaments
        const tournamentIndexMap = await allTournaments;
        tmd.forEach(val => {
            const currRow = rawDataGrouped[val.teamNumber]
            const ti = tournamentIndexMap.indexOf(val.tournamentKey);
            currRow.tournamentData[ti] ||= { srEvents: [], driverAbility: [], endgamePoints: [] };

            // Push data in
            for (const sr of val.scoutReports) {
                const currRowTournament = currRow.tournamentData[ti];
                currRowTournament.srEvents.push(sr.events);
                currRowTournament.driverAbility.push(sr.driverAbility);
                currRowTournament.endgamePoints.push(endgameToPoints[sr.bargeResult]);

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

        const finalResults: Partial<Record<Metric, Record<number, number>>> = {};
        for (const metric of metrics) {
            // Team => tournament => average value of metric
            let resultsByTournament: number[][] = [];

            if (metric === Metric.bargePoints) {
                finalResults[metric] = {};
                for (const team of teams) {
                    // Using rule of succession for endgame
                    finalResults[metric][team] = endgameRuleOfSuccession(rawDataGrouped[team].endgame.resultCount, rawDataGrouped[team].endgame.totalAttempts);
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
                // Generic averages if no reusable data is available
                if (teleopPoints.length === 0 && (metric === Metric.totalPoints || metric === Metric.teleopPoints)) {
                    for (const team of teams) {
                        teleopPoints[team] = [];
                        rawDataGrouped[team].tournamentData.forEach(tournament => {
                            const timedEvents = tournament.srEvents.map(val => val.filter(e => e.time > autoEnd));
                            const pointSumsByReport = timedEvents.map(e => e.reduce((acc, cur) => acc + cur.points, 0));

                            teleopPoints[team].push(avgOrZero(pointSumsByReport));
                        });
                    }
                }
                if (autoPoints.length === 0 && (metric === Metric.totalPoints || metric === Metric.autoPoints)) {
                    for (const team of teams) {
                        autoPoints[team] = [];
                        rawDataGrouped[team].tournamentData.forEach(tournament => {
                            const timedEvents = tournament.srEvents.map(val => val.filter(e => e.time <= autoEnd));
                            const pointSumsByReport = timedEvents.map(e => e.reduce((acc, cur) => acc + cur.points, 0));

                            autoPoints[team].push(avgOrZero(pointSumsByReport));
                        });
                    }
                }

                // Set up data for final push into result
                if (metric === Metric.teleopPoints) {
                    resultsByTournament = teleopPoints;
                } else if (metric === Metric.autoPoints) {
                    resultsByTournament = autoPoints;
                } else if (metric === Metric.totalPoints) {
                    // Include endgame points for total
                    for (const team of teams) {
                        resultsByTournament[team] = [];
                        let tournamentIndex = 0;
                        rawDataGrouped[team].tournamentData.forEach(tournament => {
                            resultsByTournament[team][tournamentIndex] = teleopPoints[team][tournamentIndex] + autoPoints[team][tournamentIndex] + avgOrZero(tournament.endgamePoints);
                            tournamentIndex++;
                        });
                    }
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

            // Weight by tournament, most recent tournaments heavier
            finalResults[metric] = {};
            for (const team of teams) {
                finalResults[metric][team] = weightedTourAvgLeft(resultsByTournament[team]);
            }
        }

        return finalResults;
    }
    catch (error) {
        console.log(error)
        throw (error)
    }

};

/**
 * Attempts to make filters more efficient.
 * Could still cause problems at tournaments; should be stress tested.
 * Failure should be treated by changing first condition to a tolerance.
 *
 * @param sources list of sources to use
 * @param possibleSources list of all possible sources
 * @returns prisma filter for a list
 */
export const getSourceFilter = <T>(sources: T[], possibleSources: T[]): ArrayFilter<T> | undefined => {
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
