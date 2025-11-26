import prismaClient from "../../../prismaClient";
import {
  FlippedActionMap,
  FlippedPositionMap,
  autoEnd,
} from "../analysisConstants";
import z from "zod";
import { createAnalysisFunction } from "../analysisFunction";

export const autoPathScouter = createAnalysisFunction({
  argsSchema: z.object({ matchKey: z.string(), scoutReportUuid: z.string() }),
  returnSchema: z.object({
    autoPoints: z.number(),
    positions: z.array(
      z.object({
        location: z.number(),
        event: z.number(),
        time: z.number(),
      }),
    ),
    match: z.string(),
    tournamentName: z.string(),
  }),
  usesDataSource: false,
  shouldCache: true,
  createKey: (args) => ({
    key: ["autoPathScouter", args.matchKey, args.scoutReportUuid],
  }),
  calculateAnalysis: async (args) => {
    const autoData = await prismaClient.event.findMany({
      where: {
        scoutReport: {
          uuid: args.scoutReportUuid,
        },
        time: {
          lte: autoEnd,
        },
      },
    });
    const scoutReport = await prismaClient.scoutReport.findUnique({
      where: {
        uuid: args.scoutReportUuid,
      },
    });
    const match = await prismaClient.teamMatchData.findUnique({
      where: {
        key: scoutReport.teamMatchKey,
      },
      include: {
        tournament: true,
      },
    });

    const totalScore = autoData.reduce((sum, event) => sum + event.points, 0);
    const positions = autoData.map((event) => ({
      location: FlippedPositionMap[event.position],
      event: FlippedActionMap[event.action],
      time: event.time,
    }));

    return {
      autoPoints: totalScore,
      positions: positions,
      match: args.matchKey,
      tournamentName: match.tournament.name,
    };
  },
});
