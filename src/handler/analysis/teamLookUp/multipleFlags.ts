import z from "zod";
import { rankFlag } from "../rankFlag";
import { metricsCategory, metricToName } from "../analysisConstants";
import { arrayAndAverageTeams } from "../coreAnalysis/arrayAndAverageTeams";
import { createAnalysisHandler } from "../analysisHandler";

export const multipleFlags = createAnalysisHandler({
  params: {
    params: z.object({
      team: z.preprocess((x) => Number(x), z.number()),
    }),
    query: z.object({
      flags: z.string().transform((val) => {
        try {
          return JSON.parse(val) || [];
        } catch {
          return [];
        }
      }),
      tournamentKey: z.string().nullable().optional(),
    }),
  },
  usesDataSource: true,
  createKey: ({ params, query }) => {
    return {
      key: [
        "multipleFlags",
        params.team.toString(),
        JSON.stringify(query.flags),
        query.tournamentKey || "",
      ],
      teamDependencies: [params.team],
    };
  },
  calculateAnalysis: async ({ params, query }, ctx) => {
    const arr: number[] = [];
    for (const flag of query.flags) {
      if (flag === "rank") {
        // Find team rank if a tournament is provided
        if (query.tournamentKey) {
          arr.push(
            (await rankFlag(query.tournamentKey, params.team))[params.team],
          );
        } else {
          arr.push(0);
        }
      } else {
        // Map flag to a metric and use AAT (should probably use a map but wtv)
        for (let i = metricsCategory.length - 1; i >= 0; i--) {
          if (flag === metricToName[metricsCategory[i]]) {
            arr.push(
              (
                await arrayAndAverageTeams(
                  [params.team],
                  metricsCategory[i],
                  ctx.user,
                )
              )[params.team].average,
            );
            break;
          } else if (i === 0) {
            // No flag found probably shouldnt throw a full error, just push a falsy
            console.error(`Bad flag string: ${flag} for team ${params.team}`);
            arr.push(NaN);
          }
        }
      }
    }

    return arr;
  },
});
