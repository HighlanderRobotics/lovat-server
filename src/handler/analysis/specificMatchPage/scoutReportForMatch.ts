import prismaClient from "../../../prismaClient";
import z from "zod";
import { UserRole } from "@prisma/client";
import { createAnalysisHandler } from "../analysisHandler";

export const scoutReportForMatch = createAnalysisHandler({
  params: {
    params: z.object({
      match: z.string(),
    }),
  },
  usesDataSource: false,
  createKey: ({ params }) => {
    return {
      key: ["scoutReportForMatch", params.match],
      teamDependencies: [],
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
