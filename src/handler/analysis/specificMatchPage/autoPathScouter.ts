import prismaClient from "../../../prismaClient.js";
import {
  FlippedActionMap,
  FlippedPositionMap,
  autoEnd,
} from "../analysisConstants.js";
import z from "zod";
import { runAnalysis } from "../analysisFunction.js";
import { AutoClimbReverseMap } from "../../manager/managerConstants.js";

const config = {
  argsSchema: z.object({ matchKey: z.string(), scoutReportUuid: z.string() }),
  returnSchema: z.object({
    autoPoints: z.number(),
    positions: z.array(
      z.object({
        location: z.number(),
        event: z.number(),
        time: z.number(),
        quantity: z.number().optional(),
      }),
    ),
    match: z.string(),
    tournamentName: z.string(),
  }),
  usesDataSource: false,
  shouldCache: true,
  createKey: async (args: { matchKey: string; scoutReportUuid: string }) => ({
    key: ["autoPathScouter", args.matchKey, args.scoutReportUuid],
  }),
  calculateAnalysis: async (args: {
    matchKey: string;
    scoutReportUuid: string;
  }) => {
    const autoData = await prismaClient.event.findMany({
      where: {
        scoutReport: {
          uuid: args.scoutReportUuid,
        },
        time: {
          lte: autoEnd,
        },
      },
      orderBy: {
        time: "asc",
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
      quantity: event.points,
    }));

    return {
      autoPoints: totalScore,
      positions: positions,
      match: args.matchKey,
      tournamentName: match.tournament.name,
      climb: AutoClimbReverseMap[scoutReport.autoClimb],
    };
  },
} as const;

export async function autoPathScouter(
  user: any,
  args: { matchKey: string; scoutReportUuid: string },
) {
  return runAnalysis(config as any, user, args as any);
}
