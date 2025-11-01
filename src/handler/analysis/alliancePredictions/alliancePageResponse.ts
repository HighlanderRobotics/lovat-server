import z from "zod";
import { alliancePage } from "./alliancePage";
import { createAnalysisHandler } from "../analysisHandler";

export const alliancePageResponse = createAnalysisHandler({
  params: {
    query: z.object({
      teamOne: z.preprocess((x) => Number(x), z.number()),
      teamTwo: z.preprocess((x) => Number(x), z.number()),
      teamThree: z.preprocess((x) => Number(x), z.number()),
    }),
  },
  usesDataSource: true,
  createKey: ({ query }) => {
    const teams = [query.teamOne, query.teamTwo, query.teamThree].sort();
    return {
      key: ["alliancePageResponse", ...teams.map(t => t.toString())],
      teamDependencies: teams,
    };
  },
  calculateAnalysis: async ({ query }, ctx) => {
    const alliancePageData = await alliancePage(
      ctx.user,
      query.teamOne,
      query.teamTwo,
      query.teamThree,
    );

    return alliancePageData;
  },
});
