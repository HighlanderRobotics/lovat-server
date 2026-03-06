import prismaClient from "../../../prismaClient.js";
import z from "zod";
import { createAnalysisHandler } from "../analysisHandler.js";
import { UserRole } from "@prisma/client";

export const scoutReportForMatch = createAnalysisHandler({
  params: {
    params: z.object({
      match: z.string(),
    }),
  },
  usesDataSource: false,
  shouldCache: false,
  createKey: async ({ params }) => {
    return {
      key: ["scoutReportForMatch", params.match],
      teamDependencies: [],
      tournamentDependencies: [],
    };
  },
  calculateAnalysis: async ({ params }, ctx) => {
    const scoutReports = await prismaClient.scoutReport.findMany({
      where: {
        teamMatchKey: params.match,
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
            sourceTeamNumber: true,
          },
        },
      },
    });

    for (const report of scoutReports) {
      if (ctx.user.teamNumber === report.scouter.sourceTeamNumber) {
        report.scouter.name = `Scouter from ${report.scouter.sourceTeamNumber}`;
      }
    }

    return scoutReports.map((report) => ({
      ...report,
      canModify:
        ctx.user?.role === UserRole.SCOUTING_LEAD &&
        ctx.user.teamNumber === report.scouter.sourceTeamNumber,
    }));
  },
});
