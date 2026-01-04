import prismaClient from "../../../prismaClient.js";
import z from "zod";
import { UserRole }from "../../../generated/prisma/client.js";
import { createAnalysisHandler } from "../analysisHandler.js";

export const scoutReportForMatch = createAnalysisHandler({
  params: {
    params: z.object({
      match: z.string(),
    }),
  },
  usesDataSource: false,
  shouldCache: false,
  createKey: ({ params }) => {
    return {
      key: ["scoutReportForMatch", params.match],
      teamDependencies: [],
      tournamentDependencies: [],
    };
  },
  calculateAnalysis: async ({ params }, ctx) => {
    //comfirm if finding first is ideal
    if (
      ctx.user.teamNumber === null ||
      ctx.user.role !== UserRole.SCOUTING_LEAD
    ) {
      throw new Error("Not authorized to access this endpoint.");
    }

    const scoutReports = await prismaClient.scoutReport.findMany({
      where: {
        teamMatchKey: params.match,
        scouter: {
          sourceTeamNumber: ctx.user.teamNumber,
        },
      },

      select: {
        uuid: true,
        scouterUuid: true,
        notes: true,
        startTime: true,
        robotBrokeDescription: true,
        scouter: {
          select: {
            name: true,
          },
        },
      },
    });

    return scoutReports;
  },
});
