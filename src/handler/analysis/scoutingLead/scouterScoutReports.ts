import prismaClient from "@/src/prismaClient.js";
import z from "zod";
import { createAnalysisHandler } from "@/src/handler/analysis/analysisHandler.js";

export const scouterScoutReports = createAnalysisHandler({
  params: {
    query: z.object({
      tournamentKey: z.string().nullable().optional(),
      scouterUuid: z.string(),
    }),
  },
  usesDataSource: true,
  shouldCache: false,
  createKey: ({ query }) => ({
    key: ["scouterScoutReports", query.scouterUuid, query.tournamentKey || ""],
    teamDependencies: [],
    tournamentDependencies: query.tournamentKey ? [query.tournamentKey] : [],
  }),
  calculateAnalysis: async ({ query }, ctx) => {
    const scouter = await prismaClient.scouter.findUnique({
      where: { uuid: query.scouterUuid },
    });
    if (!scouter) {
      throw new Error("SCOUTER_NOT_FOUND");
    }
    if (
      ctx.user.role !== "SCOUTING_LEAD" ||
      ctx.user.teamNumber === null ||
      ctx.user.teamNumber !== scouter.sourceTeamNumber
    ) {
      throw new Error("FORBIDDEN");
    }

    if (!query.tournamentKey) {
      const allScoutReports = await prismaClient.scoutReport.findMany({
        where: { scouterUuid: query.scouterUuid },
        select: {
          scouter: { select: { name: true } },
          teamMatchData: {
            select: {
              teamNumber: true,
              key: true,
              matchNumber: true,
              matchType: true,
              tournament: { select: { key: true, name: true } },
            },
          },
          uuid: true,
        },
        orderBy: [
          { teamMatchData: { tournament: { date: "desc" } } },
          { teamMatchData: { matchType: "desc" } },
          { teamMatchData: { matchNumber: "desc" } },
        ],
      });
      return allScoutReports;
    }

    const tournamentScoutReports = await prismaClient.scoutReport.findMany({
      where: {
        scouterUuid: query.scouterUuid,
        teamMatchData: { tournamentKey: query.tournamentKey },
      },
      select: {
        scouter: { select: { name: true } },
        teamMatchData: {
          select: {
            teamNumber: true,
            key: true,
            matchNumber: true,
            matchType: true,
            tournament: { select: { key: true, name: true } },
          },
        },
        uuid: true,
      },
      orderBy: [
        { teamMatchData: { tournament: { date: "desc" } } },
        { teamMatchData: { matchType: "desc" } },
        { teamMatchData: { matchNumber: "desc" } },
      ],
    });
    return tournamentScoutReports;
  },
});
