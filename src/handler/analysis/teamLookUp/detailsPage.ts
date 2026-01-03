import z from "zod";
import { autoPathsTeam } from "@/src/handler/analysis/autoPaths/autoPathsTeam.js";
import { averageAllTeamFast } from "@/src/handler/analysis/coreAnalysis/averageAllTeamFast.js";
import {
  Metric,
  metricsToNumber,
} from "@/src/handler/analysis/analysisConstants.js";
import { arrayAndAverageTeams } from "@/src/handler/analysis/coreAnalysis/arrayAndAverageTeams.js";
import { createAnalysisHandler } from "@/src/handler/analysis/analysisHandler.js";

export const detailsPage = createAnalysisHandler({
  params: {
    params: z.object({
      team: z.preprocess((x) => Number(x), z.number()),
      metric: z.string(),
    }),
  },
  usesDataSource: true,
  shouldCache: true,
  createKey: ({ params }) => {
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
    }
    // else if (params.metric === Metric.scores) {
    //     const teamAverageAndTimeLine = await arrayAndAverageTeam(ctx.user, params.metric, params.team)
    //     const allTeamAverage = await averageAllTeamOneQuery(ctx.user, params.metric)
    //     // let ampScores = await arrayAndAverageTeam(ctx.user, "ampscores", params.team)
    //     const speakerScores = await arrayAndAverageTeam(ctx.user, Metric.speakerscores, params.team)

    //     const result = {
    //         array: speakerScores,
    //         result: teamAverageAndTimeLine.average,
    //         all: allTeamAverage,
    //         difference: teamAverageAndTimeLine.average - allTeamAverage,
    //         team: params.team
    //     }
    //     return result
    // }
    else {
      const teamAverageAndTimeLine = (
        await arrayAndAverageTeams(ctx.user, {
          teams: [params.team],
          metric: metricsToNumber[params.metric] as Metric,
        })
      )[params.team];
      const allTeamAverage = (await averageAllTeamFast(ctx.user, {
        metric: metricsToNumber[params.metric] as Metric,
      })) as number;
      const result = {
        array: teamAverageAndTimeLine.timeLine,
        result: teamAverageAndTimeLine.average,
        all: allTeamAverage,
        difference: teamAverageAndTimeLine.average - allTeamAverage,
        team: params.team,
      };
      return result;
    }
  },
});
