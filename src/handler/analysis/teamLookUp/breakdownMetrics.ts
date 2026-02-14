import z from "zod";
import prismaClient from "../../../prismaClient.js";
import { nonEventMetric } from "../coreAnalysis/nonEventMetric.js";
import { MetricsBreakdown } from "../analysisConstants.js";
import { createAnalysisHandler } from "../analysisHandler.js";

export const breakdownMetrics = createAnalysisHandler({
  params: {
    params: z.object({
      team: z.preprocess((x) => Number(x), z.number()),
    }),
  },
  usesDataSource: true,
  shouldCache: true,
  createKey: async ({ params }) => {
    return {
      key: ["breakdownMetrics", params.team.toString()],
      teamDependencies: [params.team],
      tournamentDependencies: [],
    };
  },
  calculateAnalysis: async ({ params }, ctx) => {
    const teamRow = await prismaClient.team.findUnique({
      where: { number: params.team },
      select: { number: true },
    });

    if (!teamRow) {
      return { error: "TEAM_DOES_NOT_EXIST" };
    }

    const reportCount = await prismaClient.scoutReport.count({
      where: {
        teamMatchData: {
          teamNumber: params.team,
        },
      },
    });
    if (reportCount === 0) {
      return { error: "NO_DATA_FOR_TEAM" };
    }

    const result: Record<string, any> = {};
    for (const [key, metric] of Object.entries(MetricsBreakdown)) {
      const data = await nonEventMetric(ctx.user, {
        team: params.team,
        metric: metric,
      });

      const valid = Object.values(data).some((val) => Boolean(val));

      if (valid) {
        result[key] = data;
      }
    }

    return result;
  },
});
