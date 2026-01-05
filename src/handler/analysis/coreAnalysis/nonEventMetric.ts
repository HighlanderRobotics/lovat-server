import prismaClient from "../../../prismaClient.js";
import { EventAction, User }from "../../../generated/prisma/client.js";
import {
  breakdownNeg,
  breakdownPos,
  breakdownToEnum,
  MetricsBreakdown,
} from "../analysisConstants.js";

import z from "zod";
import {
  dataSourceRuleToPrismaFilter,
  dataSourceRuleSchema,
} from "../dataSourceRule.js";
import { runAnalysis } from "../analysisFunction.js";

/**
 * Optimized function: Returns a mapping of each distinct (lowercased) metric value to its percentage,
 * calculated directly in the database with a single query.
 */
const config: any = {
  argsSchema: z.object({
    team: z.number(),
    metric: z.nativeEnum(MetricsBreakdown),
  }),
  returnSchema: z.object({}).catchall(z.number()),
  usesDataSource: true,
  shouldCache: true,
  createKey: (args) => ({
    key: ["nonEventMetric", args.team.toString(), String(args.metric)],
    teamDependencies: [args.team],
    tournamentDependencies: [],
  }),
  calculateAnalysis: async (
    args: z.infer<typeof config.argsSchema>,
    ctx: { user: User },
  ) => {
    try {
      const tnmRule = dataSourceRuleSchema(z.string()).parse(
        ctx.user.tournamentSourceRule,
      );
      const teamRule = dataSourceRuleSchema(z.number()).parse(
        ctx.user.teamSourceRule,
      );

      const sourceTnmtFilter = dataSourceRuleToPrismaFilter<string>(tnmRule);
      const sourceTeamFilter = dataSourceRuleToPrismaFilter<number>(teamRule);

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

      if (args.metric === MetricsBreakdown.leavesAuto) {
        const numLeaves = await prismaClient.teamMatchData.count({
          where: {
            teamNumber: args.team,
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
            teamNumber: args.team,
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
      SELECT s."${args.metric}" AS breakdown,
        COUNT(s."scouterUuid")::float / SUM(COUNT(s."scouterUuid")) OVER () AS percentage
      FROM "ScoutReport" s
      JOIN "TeamMatchData" tmd ON tmd."key" = s."teamMatchKey"
      JOIN "Scouter" sc ON sc."uuid" = s."scouterUuid"
      WHERE tmd."teamNumber" = $3
        AND ${tournamentCondition}
        AND ${teamCondition}
      GROUP BY s."${args.metric}"
    `;

      interface QueryRow {
        breakdown: string;
        percentage: string;
      }

      const data = await prismaClient.$queryRawUnsafe<QueryRow[]>(
        query,
        tournamentList,
        teamList,
        args.team,
      );

      const result: Record<string, number> = {};
      for (const possibleRow of breakdownToEnum[args.metric]) {
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
  },
} as const;

export type NonEventMetricArgs = z.infer<typeof config.argsSchema>;
export type NonEventMetricResult = z.infer<typeof config.returnSchema>;
export async function nonEventMetric(
  user: User,
  args: NonEventMetricArgs,
): Promise<NonEventMetricResult> {
  return runAnalysis(config, user, args);
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
