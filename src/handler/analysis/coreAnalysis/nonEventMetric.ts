import prismaClient from '../../../prismaClient'
import { EventAction, User } from "@prisma/client";
import { allTeamNumbers, allTournaments, breakdownNeg, breakdownPos, breakdownToEnum, MetricsBreakdown } from "../analysisConstants";
import { getSourceFilter } from './averageManyFast';

/**
 * Optimized function: Returns a mapping of each distinct (lowercased) metric value to its percentage,
 * calculated directly in the database with a single query.
 */
export const nonEventMetric = async (user: User, team: number, metric: MetricsBreakdown): Promise<Record<string, number>> => {
    try {

        // Special condition for auto leaves
        if (metric === MetricsBreakdown.leavesAuto) {
            const sourceTnmtFilter = getSourceFilter(user.tournamentSource, await allTournaments);
            const sourceTeamFilter = getSourceFilter(user.teamSource, await allTeamNumbers);

            const numLeaves = await prismaClient.teamMatchData.count({
                where: {
                    teamNumber: team,
                    tournamentKey: sourceTnmtFilter,
                    scoutReports: {
                        some: {
                            AND: {
                                events: {
                                    some: {
                                        action: EventAction.AUTO_LEAVE,
                                    }
                                },
                                scouter: {
                                    sourceTeamNumber: sourceTeamFilter
                                }
                            }
                        }
                    }
                }
            });

            const totalMatches = await prismaClient.teamMatchData.count({
                where: {
                    teamNumber: team,
                    tournamentKey: sourceTnmtFilter,
                    scoutReports: {
                        some: {
                            scouter: {
                                sourceTeamNumber: sourceTeamFilter
                            }
                        }
                    }
                }
            });

            const perc = numLeaves/totalMatches

            return {
                "True": perc,
                "False": 1 - perc
            }
        }

        const query = `
        SELECT "${metric}" AS breakdown,
            COUNT(s."scouterUuid") / SUM(COUNT(s."scouterUuid")) OVER () AS percentage
        FROM "ScoutReport" s
        JOIN "TeamMatchData" tmd ON tmd."key" = s."teamMatchKey"
        JOIN "Scouter" sc ON sc."uuid" = s."scouterUuid"
        WHERE tmd."teamNumber" = ${team}
            AND tmd."tournamentKey" = ANY($1)
            AND sc."sourceTeamNumber" = ANY($2)
        GROUP BY s."${metric}"
        `;

        interface QueryRow {
            breakdown: string;
            percentage: string;
        }

        const data = await prismaClient.$queryRawUnsafe<QueryRow[]>(
            query,
            user.tournamentSource,
            user.teamSource
        );

        const result = {}
        for (const possibleRow of breakdownToEnum[metric]) {
            result[possibleRow] = 0;
        }
        for (const row of data) {
            const option = transformBreakdown(row.breakdown);
            result[option] = parseFloat(row.percentage);
        }

        return result;
    } catch (error) {
        console.error('Error in nonEventMetric:', error);
        throw error;
    }
}

// Edit to work with true/false breakdowns
export const transformBreakdown = (input: string): string => {
    switch (input) {
        case "YES":
            return breakdownPos;
        case "NO":
            return breakdownNeg;
        default:
            return input;
    }
};