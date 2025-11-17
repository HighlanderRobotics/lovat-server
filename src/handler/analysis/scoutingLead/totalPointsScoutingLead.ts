import prismaClient from "../../../prismaClient";
import z from "zod";
import { createAnalysisFunction } from "../analysisFunction";

export const totalPointsScoutingLead = createAnalysisFunction({
  argsSchema: z.object({ scoutReportUuid: z.string() }),
  returnSchema: z.number(),
  usesDataSource: false,
  shouldCache: true,
  createKey: (args) => ({
    key: ["totalPointsScoutingLead", args.scoutReportUuid],
  }),
  calculateAnalysis: async (args) => {
    const points = await prismaClient.event.aggregate({
      where: {
        scoutReportUuid: args.scoutReportUuid,
      },
      _sum: {
        points: true,
      },
    });
    const totalPoints = points._sum.points || 0;
    return totalPoints;
  },
});
