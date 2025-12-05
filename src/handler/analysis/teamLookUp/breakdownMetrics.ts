import z from "zod";
import { nonEventMetric } from "../coreAnalysis/nonEventMetric.js";
import { lowercaseToBreakdown, MetricsBreakdown } from "../analysisConstants.js";
import { createAnalysisHandler } from "../analysisHandler.js";

export const breakdownMetrics = createAnalysisHandler({
  params: {
    params: z.object({
      team: z.preprocess((x) => Number(x), z.number()),
    }),
  },
  usesDataSource: true,
  shouldCache: true,
  createKey: ({ params }) => {
    return {
      key: ["breakdownMetrics", params.team.toString()],
      teamDependencies: [params.team],
      tournamentDependencies: [],
    };
  },
  calculateAnalysis: async ({ params }, ctx) => {
    const result = {};
    for (const [key, metric] of Object.entries(lowercaseToBreakdown)) {
      const data = await nonEventMetric(ctx.user, {
        team: params.team,
        metric: MetricsBreakdown[metric as keyof typeof MetricsBreakdown],
      });

      const valid = Object.values(data).some((val) => Boolean(val));

      if (valid) {
        result[key] = data;
      }
    }

    return result;
  },
});
