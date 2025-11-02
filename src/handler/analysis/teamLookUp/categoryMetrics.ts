import z from "zod";
import { metricsCategory, metricToName } from "../analysisConstants";
import { averageManyFast } from "../coreAnalysis/averageManyFast";
import { createAnalysisHandler } from "../analysisHandler";

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
    const data = await averageManyFast(
      [params.team],
      metricsCategory,
      ctx.user,
    );

    for (const metric of metricsCategory) {
      result[metricToName[metric]] = data[metric][params.team];
    }

    return result;
  },
});
