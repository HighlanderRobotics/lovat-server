import prismaClient from "../../../prismaClient.js";
import z from "zod";
import { runAnalysis } from "../analysisFunction.js";

const config = {
  argsSchema: z.object({ scoutReportUuid: z.string() }),
  returnSchema: z.number(),
  usesDataSource: false,
  shouldCache: true,
  createKey: async (args: { scoutReportUuid: string }) => ({
    key: ["totalPointsScoutingLead", args.scoutReportUuid],
  }),
  calculateAnalysis: async (args: { scoutReportUuid: string }) => {
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
} as const;

export async function totalPointsScoutingLead(
  user: any,
  args: { scoutReportUuid: string },
) {
  return runAnalysis(config as any, user, args as any);
}
