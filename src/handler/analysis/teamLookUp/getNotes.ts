import prismaClient from "../../../prismaClient";
import z from "zod";
import {
  dataSourceRuleSchema,
  dataSourceRuleToPrismaQuery,
} from "../dataSourceRule";
import { createAnalysisHandler } from "../analysisHandler";

export const getNotes = createAnalysisHandler({
  params: {
    params: z.object({
      team: z.preprocess((x) => Number(x), z.number()),
    }),
  },
  usesDataSource: true,
  shouldCache: true,
  createKey: ({ params }) => {
    return {
      key: ["getNotes", params.team.toString()],
      teamDependencies: [params.team],
      tournamentDependencies: [],
    };
  },
  calculateAnalysis: async ({ params }, ctx) => {
    let notesAndMatches: {
      notes: string;
      match: string;
      tounramentName: string; // Typo for backwards compatibility
      sourceTeam: number;
      scouterName?: string;
    }[];

    // Set up filters to decrease server load
    const sourceTnmtFilter = dataSourceRuleToPrismaQuery(
      dataSourceRuleSchema(z.string()).parse(ctx.user.tournamentSourceRule),
    );
    const sourceTeamFilter = dataSourceRuleToPrismaQuery(
      dataSourceRuleSchema(z.number()).parse(ctx.user.teamSourceRule),
    );

    const noteData = await prismaClient.scoutReport.findMany({
      where: {
        teamMatchData: {
          teamNumber: params.team,
          tournamentKey: sourceTnmtFilter,
        },
        scouter: {
          sourceTeamNumber: sourceTeamFilter,
        },
        notes: {
          not: "",
        },
      },
      select: {
        notes: true,
        teamMatchKey: true,
        teamMatchData: {
          select: {
            tournament: {
              select: {
                name: true,
              },
            },
          },
        },
        scouter: {
          select: {
            sourceTeamNumber: true,
            name: Boolean(ctx.user.teamNumber),
          },
        },
      },
      orderBy: [
        // Ordered by most recent first
        { teamMatchData: { tournament: { date: "desc" } } },
        { teamMatchData: { matchType: "desc" } },
        { teamMatchData: { matchNumber: "desc" } },
      ],
    });

    if (Boolean(ctx.user.teamNumber)) {
      notesAndMatches = noteData.map((report) => ({
        notes: report.notes,
        match: report.teamMatchKey,
        tounramentName: report.teamMatchData.tournament.name,
        sourceTeam: report.scouter.sourceTeamNumber,
        scouterName:
          report.scouter.sourceTeamNumber === ctx.user.teamNumber
            ? report.scouter.name
            : undefined,
      }));
    } else {
      notesAndMatches = noteData.map((report) => ({
        notes: report.notes,
        match: report.teamMatchKey,
        tounramentName: report.teamMatchData.tournament.name,
        sourceTeam: report.scouter.sourceTeamNumber,
      }));
    }

    return notesAndMatches;
  },
});
