import prismaClient from "../../../prismaClient.js";
import { User } from "@prisma/client";
import {
  breakdownNeg,
  breakdownPos,
  breakdownToEnum,
  MetricsBreakdown,
} from "../analysisConstants.js";

import z from "zod";
import { dataSourceRuleSchema } from "../dataSourceRule.js";
import { runAnalysis } from "../analysisFunction.js";

/**
 * Returns a mapping of each metric value to its percentage.
 * Array metrics (robotRoles, feederTypes) are expanded via UNNEST.
 */
const config = {
  argsSchema: z.object({
    team: z.number(),
    metric: z.nativeEnum(MetricsBreakdown),
  }),
  returnSchema: z.object({}).catchall(z.number()),
  usesDataSource: true,
  shouldCache: true,
  createKey: async (args) => ({
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

      const ARRAY_METRICS = new Set<MetricsBreakdown>([
        MetricsBreakdown.robotRole,
        MetricsBreakdown.feederType,
      ]);

      const isArrayMetric = ARRAY_METRICS.has(args.metric);

      const query = isArrayMetric
        ? `
          SELECT value AS breakdown,
                 COUNT(*)::float / SUM(COUNT(*)) OVER () AS percentage
          FROM "ScoutReport" s
          JOIN "TeamMatchData" tmd ON tmd."key" = s."teamMatchKey"
          JOIN "Scouter" sc ON sc."uuid" = s."scouterUuid"
          CROSS JOIN UNNEST(s."${args.metric}") AS value
          WHERE tmd."teamNumber" = $3
            AND ${tournamentCondition}
            AND ${teamCondition}
          GROUP BY value
        `
        : `
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
        breakdown: any;
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

// Handles boolean + passthrough enum values
export const transformBreakdown = (input: any): string => {
  switch (input) {
    case true:
      return breakdownPos;
    case false:
      return breakdownNeg;
    default:
      return input;
  }
};
