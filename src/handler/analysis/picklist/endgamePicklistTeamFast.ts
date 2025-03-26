import prismaClient from '../../../prismaClient'
import { BargeResult, User } from "@prisma/client";
import { allTeamNumbers, allTournaments, defaultEndgamePoints, endgameToPoints } from "../analysisConstants";
import { getSourceFilter } from '../coreAnalysis/arrayAndAverageManyFast';

// Number of endgame possibilities that result in points earned (essentially, successes)
const numPointResults: number = Object.keys(BargeResult).reduce((acc, cur) => {
    if (endgameToPoints[BargeResult[cur as keyof typeof BargeResult]] !== 0) {
        acc++;
    }
    return acc;
}, 0);

/**
 * Queries data and uses rule of succession to predict endgame points.
 * Used in place of a straight average.
 *
 * @param team team number
 * @param sourceTeamFilter team filter to use
 * @param sourceTnmtFilter tournament filter to use
 * @returns predicted points for future endgame actions
 */
export const endgamePicklistTeamFast = async (team: number, user: User): Promise<number> => {
    try {
        const sourceTeamFilter = getSourceFilter(user.teamSource, await allTeamNumbers);
        const sourceTnmtFilter = getSourceFilter(user.tournamentSource, await allTournaments)

        // Get data
        const endgameRows = await prismaClient.scoutReport.groupBy({
            by: ['bargeResult'],
            _count: {
                _all: true
            },
            where: {
                teamMatchData: {
                    teamNumber: team,
                    tournamentKey: sourceTnmtFilter
                },
                scouter: {
                    sourceTeamNumber: sourceTeamFilter
                }
            }
        })

        // Map endgame result to number of occurences and count total attempts
        let totalAttempts = 0;
        const endgameMap: Partial<Record<BargeResult, number>> = endgameRows.reduce((map, curr) => {
            if (curr.bargeResult !== BargeResult.NOT_ATTEMPTED) {
                totalAttempts += curr._count._all;
                map[curr.bargeResult] = curr._count._all;
            }
            return map;
        }, {} as typeof endgameMap);

        return endgameRuleOfSuccession(endgameMap, totalAttempts);
    }
    catch (error) {
        console.log(error)
        throw (error)
    }
}

/**
 * Uses rule of succession to predict endgame points.
 * Used in place of a straight average.
 *
 * @param data object mapping endgame results to count of occurences
 * @param totalAttempts total number of occurences
 * @returns predicted endgame points
 */
export const endgameRuleOfSuccession = (data: Partial<Record<BargeResult, number>>, totalAttempts: number): number => {
    // Return base value (can be tuned)
    if (totalAttempts === 0) {
        return defaultEndgamePoints;
    }

    let avgRuleOfSuccession = 0;
    for (const element in BargeResult) {
        const result: BargeResult = BargeResult[element as keyof typeof BargeResult];

        // Increment rule of succession based on:
        // [{times observed} + 1] / [{total count} + {success possibilities} + {1 failure possibility}]
        if (data[result] && result !== BargeResult.NOT_ATTEMPTED) {
            avgRuleOfSuccession += (data[result] + 1) / (totalAttempts + numPointResults + 1);
        }
    }

    return avgRuleOfSuccession;
}
