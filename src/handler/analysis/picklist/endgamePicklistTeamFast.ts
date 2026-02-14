import { EndgameClimb, Prisma } from "@prisma/client";
import prismaClient from "../../../prismaClient.js";
import { defaultEndgamePoints, endgameToPoints } from "../analysisConstants.js";

// Number of endgame possibilities that result in points earned (essentially, successes)
const numPointResults: number = Object.keys(EndgameClimb).reduce((acc, cur) => {
  if (endgameToPoints[EndgameClimb[cur as keyof typeof EndgameClimb]] !== 0) {
    acc++;
  }
  return acc;
}, 0);

/**
 * Queries data and uses rule of succession to predict endgame points.
 * Used in place of a straight average.
 *
 * @param team team number
 * @param sourceTeamFilter Prisma scalar filter or undefined
 * @param sourceTnmtFilter Prisma scalar filter or undefined
 * @returns predicted points for future endgame actions
 */
export const endgamePicklistTeamFast = async (
  team: number,
  sourceTeamFilter: { in?: number[]; notIn?: number[] } | undefined,
  sourceTnmtFilter: { in?: string[]; notIn?: string[] } | undefined,
): Promise<number> => {
  try {
    // Get data
    const endgameRows = await prismaClient.scoutReport.groupBy({
      by: ["endgameClimb"],
      _count: {
        _all: true,
      },
      where: {
        teamMatchData: {
          teamNumber: team,
          ...(sourceTnmtFilter && { tournamentKey: sourceTnmtFilter }),
        },
        ...(sourceTeamFilter && {
          scouter: { sourceTeamNumber: sourceTeamFilter },
        }),
      },
    });

    // Map endgame result to number of occurences and count total attempts
    let totalAttempts = 0;
    const endgameMap: Partial<Record<EndgameClimb, number>> =
      endgameRows.reduce(
        (map, curr) => {
          if (curr.endgameClimb !== EndgameClimb.NOT_ATTEMPTED) {
            totalAttempts += curr._count._all;
            map[curr.endgameClimb] = curr._count._all;
          }
          return map;
        },
        {} as typeof endgameMap,
      );

    return endgameRuleOfSuccession(endgameMap, totalAttempts);
  } catch (error) {
    console.log(error);
    throw error;
  }
};

/**
 * Uses rule of succession to predict endgame points.
 * Used in place of a straight average.
 *
 * @param data object mapping endgame results to count of occurences
 * @param totalAttempts total number of occurences
 * @returns predicted endgame points
 */
export const endgameRuleOfSuccession = (
  data: Partial<Record<EndgameClimb, number>>,
  totalAttempts: number,
): number => {
  // Return base value (can be tuned)
  if (totalAttempts === 0) {
    return defaultEndgamePoints;
  }

  let avgRuleOfSuccession = 0;
  for (const element in EndgameClimb) {
    const result: EndgameClimb =
      EndgameClimb[element as keyof typeof EndgameClimb];

    // Increment rule of succession based on:
    // [{times observed} + 1] / [{total count} + {success possibilities} + {1 failure possibility}]
    if (data[result] && result !== EndgameClimb.NOT_ATTEMPTED) {
      avgRuleOfSuccession +=
        (data[result] + 1) / (totalAttempts + numPointResults + 1);
    }
  }

  return avgRuleOfSuccession;
};
