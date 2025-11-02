import z from "zod";
import { autoPathsTeam } from "../autoPaths/autoPathsTeam";
import { averageAllTeamFast } from "../coreAnalysis/averageAllTeamFast";
import { Metric, metricsToNumber } from "../analysisConstants";
import { arrayAndAverageTeams } from "../coreAnalysis/arrayAndAverageTeams";
import { createAnalysisHandler } from "../analysisHandler";

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
      const autoPaths = await autoPathsTeam(ctx.user, params.team);
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
        await arrayAndAverageTeams(
          [params.team],
          metricsToNumber[params.metric],
          ctx.user,
        )
      )[params.team];
      const allTeamAverage = await averageAllTeamFast(
        metricsToNumber[params.metric],
        ctx.user,
      );
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
