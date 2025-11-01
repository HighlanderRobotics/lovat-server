import z from "zod";
import { nonEventMetric } from "../coreAnalysis/nonEventMetric";
import { lowercaseToBreakdown, MetricsBreakdown } from "../analysisConstants";
import { createAnalysisHandler } from "../analysisHandler";

export const breakdownMetrics = createAnalysisHandler({
  params: {
    params: z.object({
      team: z.preprocess((x) => Number(x), z.number()),
    }),
  },
  usesDataSource: true,
  createKey: ({ params }) => {
    return {
      key: ["breakdownMetrics", params.team.toString()],
      teamDependencies: [params.team],
    };
  },
  calculateAnalysis: async ({ params }, ctx) => {
    const result = {};
    for (const [key, metric] of Object.entries(lowercaseToBreakdown)) {
      const data = await nonEventMetric(
        ctx.user,
        params.team,
        MetricsBreakdown[metric as keyof typeof MetricsBreakdown],
      );

      const valid = Object.values(data).some((val) => Boolean(val));

      if (valid) {
        result[key] = data;
      }
    }

    return result;
  },
});
