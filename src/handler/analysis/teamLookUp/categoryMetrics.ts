import z from "zod";
import {
  metricsCategory,
  metricToName,
} from "@/src/handler/analysis/analysisConstants.js";
import { averageManyFast } from "@/src/handler/analysis/coreAnalysis/averageManyFast.js";
import { createAnalysisHandler } from "@/src/handler/analysis/analysisHandler.js";

export const categoryMetrics = createAnalysisHandler({
  params: {
    params: z.object({
      team: z.preprocess((x) => Number(x), z.number()),
    }),
  },
  usesDataSource: true,
  shouldCache: true,
  createKey: ({ params }) => {
    return {
      key: ["categoryMetrics", params.team.toString()],
      teamDependencies: [params.team],
      tournamentDependencies: [],
    };
  },
  calculateAnalysis: async ({ params }, ctx) => {
    const result = {};

    //update if statments in arrayAndAverage if the metric needs to look at scoutReport instead of events table
    const data = await averageManyFast(ctx.user, {
      teams: [params.team],
      metrics: metricsCategory,
    });

    for (const metric of metricsCategory) {
      result[metricToName[metric]] = data[metric][params.team];
    }

    return result;
  },
});
