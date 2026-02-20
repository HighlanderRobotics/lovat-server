import z from "zod";
import { autoPathsTeam } from "../autoPaths/autoPathsTeam.js";
import { averageAllTeamFast } from "../coreAnalysis/averageAllTeamFast.js";
import { Metric, metricsToNumber } from "../analysisConstants.js";
import { arrayAndAverageTeams } from "../coreAnalysis/arrayAndAverageTeams.js";
import { createAnalysisHandler } from "../analysisHandler.js";

export const detailsPage = createAnalysisHandler({
  params: {
    params: z.object({
      team: z.preprocess((x) => Number(x), z.number()),
      metric: z.string(),
      tournament: z.string().optional(),
    }),
  },
  usesDataSource: true,
  shouldCache: true,
  createKey: async ({ params }) => {
    return {
      key: ["detailsPage", params.team.toString(), params.metric.toString()],
      teamDependencies: [params.team],
      tournamentDependencies: [],
    };
  },
  calculateAnalysis: async ({ params }, ctx) => {
    if (metricsToNumber[params.metric] === Metric.autoPoints) {
      const autoPaths = await autoPathsTeam(ctx.user, { team: params.team });
      return { paths: autoPaths };
    } else {
      const metricEnum = metricsToNumber[params.metric] as Metric;
      const teamAverageAndTimeLine = (
        await arrayAndAverageTeams(ctx.user, {
          teams: [params.team],
          metric: metricEnum,
        })
      )[params.team];
      const allTeamAverage = (await averageAllTeamFast(ctx.user, {
        metric: metricEnum,
      })) as number;
      const timeLine = teamAverageAndTimeLine.timeLine;
      const resultValue = teamAverageAndTimeLine.average;
      const result = {
        array: timeLine,
        result: resultValue,
        all: allTeamAverage,
        difference: resultValue - allTeamAverage,
        team: params.team,
      };
      return result;
    }
  },
});
