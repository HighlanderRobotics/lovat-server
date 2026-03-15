import z from "zod";
import { createAnalysisHandler } from "../analysisHandler.js";
import { qualRankingPredictionLogic } from "./qualRankingPredictionLogic.js";

export const qualRankingPrediction = createAnalysisHandler({
  params: {
    query: z.object({
      tournamentKey: z.string(),
    }),
  },
  usesDataSource: true,
  shouldCache: true,
  createKey: async ({ query }) => {
    return {
      key: ["qualRankingPrediction", query.tournamentKey],
      tournamentDependencies: [query.tournamentKey],
    };
  },
  calculateAnalysis: async ({ query }, ctx) => {
    try {
      return {
        tournamentKey: query.tournamentKey,
        rankings: await qualRankingPredictionLogic(ctx.user, {
          tournamentKey: query.tournamentKey,
        }),
      };
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Failed to fetch match or team data from TBA"
      ) {
        return { error: "Failed to fetch match or team data from TBA" };
      } else if (error === "not enough data") {
        return { error: "not enough data" };
      }
      console.error("Error in qualRankingPrediction:", error);
    }
  },
});
