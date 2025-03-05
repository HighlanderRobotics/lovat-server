
import prismaClient from '../../../prismaClient'
import z from 'zod'
import { error } from "console";
import { BargeResult, User } from "@prisma/client";
import { allTeamNumbers, allTournaments, endgameToPoints, teamLowerBound, tournamentLowerBound } from "../analysisConstants";
import { getSourceFilter } from '../coreAnalysis/arrayAndAverageManyFast';

// Number of endgame possibilities that result in points earned (essentially, successes)
const numPointResults: number = Object.keys(BargeResult).reduce((acc, cur) => {
    if (endgameToPoints[BargeResult[cur as keyof typeof BargeResult]] !== 0) {
        acc++;
    }
    return acc;
}, 0);
console.log("endgame success options: " + numPointResults)

/** Uses rule of succession to predict endgame points for a given team */
export const endgamePicklistTeamFast = async (user: User, team: number) => {
    try {
        const teamFilter = getSourceFilter<number>(user.teamSource, await allTeamNumbers);
        const tnmtFilter = getSourceFilter<string>(user.tournamentSource, await allTournaments);

        // Get data
        const endgameRows = await prismaClient.scoutReport.groupBy({
            by: ['bargeResult'],
            _count: {
                _all: true
            },
            where: {
                teamMatchData: {
                    teamNumber: team,
                    tournamentKey: tnmtFilter
                },
                scouter: {
                    sourceTeamNumber: teamFilter
                }
            }
        })

        // Map endgame result to number of occurences and count total attempts
        let totalAttempts = 0;
        const endgameMap: Partial<Record<BargeResult, number>> = endgameRows.reduce((map, curr) => {
            if (curr.bargeResult !== BargeResult.NOT_ATTEMPTED) {
                totalAttempts++;

                map[curr.bargeResult] ||= 0;
                map[curr.bargeResult]++;
            }
            return map;
        }, {});

        // Return base value (can be tuned)
        if (totalAttempts === 0) {
            return 1.5;
        }

        let avgRuleOfSuccession = 0;
        for (const element in BargeResult) {
            const result: BargeResult = BargeResult[element as keyof typeof BargeResult];

            // Increment rule of succession based on: [{times observed} + 1] / [{total count} + {success possibilities} + {1 failure possibility}]
            if (endgameMap[result] && result !== BargeResult.NOT_ATTEMPTED) {
                avgRuleOfSuccession += (endgameMap[result] + 1) / (totalAttempts + numPointResults + 1);
            }
        }

        return avgRuleOfSuccession;
    }
    catch (error) {
        console.log(error)
        throw (error)
    }
}






