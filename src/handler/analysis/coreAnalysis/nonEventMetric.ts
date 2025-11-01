import prismaClient from "../../../prismaClient";
import { EventAction, User } from "@prisma/client";
import {
  breakdownNeg,
  breakdownPos,
  breakdownToEnum,
  MetricsBreakdown,
} from "../analysisConstants";

import z from "zod";
import {
  dataSourceRuleToPrismaQuery,
  dataSourceRuleSchema,
} from "../dataSourceRule";

/**
 * Optimized function: Returns a mapping of each distinct (lowercased) metric value to its percentage,
 * calculated directly in the database with a single query.
 */
export const nonEventMetric = async (
  user: User,
  team: number,
  metric: MetricsBreakdown,
): Promise<Record<string, number>> => {
  try {
    const tnmRule = dataSourceRuleSchema(z.string()).parse(
      user.tournamentSourceRule,
    );
    const teamRule = dataSourceRuleSchema(z.number()).parse(
      user.teamSourceRule,
    );

    const sourceTnmtFilter = dataSourceRuleToPrismaQuery<string>(tnmRule);
    const sourceTeamFilter = dataSourceRuleToPrismaQuery<number>(teamRule);

    const tournamentList = tnmRule.items;
    const teamList = teamRule.items;

    const tournamentCondition =
      tnmRule.mode === "INCLUDE"
        ? `tmd."tournamentKey" = ANY($1)`
        : `tmd."tournamentKey" != ALL($1)`;

    const teamCondition =
      teamRule.mode === "INCLUDE"
        ? `sc."sourceTeamNumber" = ANY($2)`
        : `sc."sourceTeamNumber" != ALL($2)`;

    if (metric === MetricsBreakdown.leavesAuto) {
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
                  },
                },
                scouter: {
                  sourceTeamNumber: sourceTeamFilter,
                },
              },
            },
          },
        },
      });

      const totalMatches = await prismaClient.teamMatchData.count({
        where: {
          teamNumber: team,
          tournamentKey: sourceTnmtFilter,
          scoutReports: {
            some: {
              scouter: {
                sourceTeamNumber: sourceTeamFilter,
              },
            },
          },
        },
      });

      const perc = numLeaves / totalMatches;

      return {
        True: perc,
        False: 1 - perc,
      };
    }

    const query = `
      SELECT s."${metric}" AS breakdown,
        COUNT(s."scouterUuid")::float / SUM(COUNT(s."scouterUuid")) OVER () AS percentage
      FROM "ScoutReport" s
      JOIN "TeamMatchData" tmd ON tmd."key" = s."teamMatchKey"
      JOIN "Scouter" sc ON sc."uuid" = s."scouterUuid"
      WHERE tmd."teamNumber" = $3
        AND ${tournamentCondition}
        AND ${teamCondition}
      GROUP BY s."${metric}"
    `;

    interface QueryRow {
      breakdown: string;
      percentage: string;
    }

    const data = await prismaClient.$queryRawUnsafe<QueryRow[]>(
      query,
      tournamentList,
      teamList,
      team,
    );

    const result: Record<string, number> = {};
    for (const possibleRow of breakdownToEnum[metric]) {
      result[possibleRow] = 0;
    }
    for (const row of data) {
      const option = transformBreakdown(row.breakdown);
      result[option] = parseFloat(row.percentage);
    }

    return result;
  } catch (error) {
    console.error("Error in nonEventMetric:", error);
    throw error;
  }
};

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
