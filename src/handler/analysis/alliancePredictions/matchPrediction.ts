import z from "zod";
import { alliancePage } from "./alliancePage.js";
import { matchPredictionLogic } from "./matchPredictionLogic.js";
import { createAnalysisHandler } from "../analysisHandler.js";

export const matchPrediction = createAnalysisHandler({
  params: {
    query: z.object({
      red1: z.preprocess((x) => (x ? x : undefined), z.coerce.number().int()),
      red2: z.preprocess((x) => (x ? x : undefined), z.coerce.number().int()),
      red3: z.preprocess((x) => (x ? x : undefined), z.coerce.number().int()),
      blue1: z.preprocess((x) => (x ? x : undefined), z.coerce.number().int()),
      blue2: z.preprocess((x) => (x ? x : undefined), z.coerce.number().int()),
      blue3: z.preprocess((x) => (x ? x : undefined), z.coerce.number().int()),
    }),
  },
  usesDataSource: true,
  shouldCache: true,
  createKey: async ({ query }) => {
    const red = [
      query.red1.toString(),
      query.red2.toString(),
      query.red3.toString(),
    ].sort();
    const blue = [
      query.blue1.toString(),
      query.blue2.toString(),
      query.blue3.toString(),
    ].sort();

    return {
      key: [
        "matchPrediction",
        ...(red[0] >= blue[0] ? red : blue),
        ...(red[0] < blue[0] ? red : blue),
      ],
      teamDependencies: [
        query.red1,
        query.red2,
        query.red3,
        query.blue1,
        query.blue2,
        query.blue3,
      ],
      tournamentDependencies: [],
    };
  },
  calculateAnalysis: async ({ query }, ctx) => {
    try {
      const matchPreictionData = await matchPredictionLogic(ctx.user, {
        red1: query.red1,
        red2: query.red2,
        red3: query.red3,
        blue1: query.blue1,
        blue2: query.blue2,
        blue3: query.blue3,
      });

      const redAlliance = await alliancePage(ctx.user, {
        team1: query.red1,
        team2: query.red2,
        team3: query.red3,
      });
      const blueAlliance = await alliancePage(ctx.user, {
        team1: query.blue1,
        team2: query.blue2,
        team3: query.blue3,
      });

      return {
        red1: query.red1,
        red2: query.red2,
        red3: query.red3,
        blue1: query.blue1,
        blue2: query.blue2,
        blue3: query.blue3,
        redWinning: matchPreictionData.redWinning,
        blueWinning: matchPreictionData.blueWinning,
        winningAlliance: matchPreictionData.winningAlliance,
        //dont display auto path stuff
        redAlliance: redAlliance,
        blueAlliance: blueAlliance,
      };
    } catch (error) {
      if (error === "not enough data") {
        return { error: "not enough data" };
      }
    }
  },
});
