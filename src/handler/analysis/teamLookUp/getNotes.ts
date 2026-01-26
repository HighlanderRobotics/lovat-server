import prismaClient from "../../../prismaClient.js";
import z from "zod";
import {
  dataSourceRuleSchema,
  dataSourceRuleToPrismaFilter,
} from "../dataSourceRule.js";
import { createAnalysisHandler } from "../analysisHandler.js";
import getNoteSummary from "../../../lib/gemini.js";

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
    const teamRow = await prismaClient.team.findUnique({
      where: { number: params.team },
      select: { number: true },
    });

    if (!teamRow) {
      return { error: "TEAM_DOES_NOT_EXIST" };
    }

    const reportCount = await prismaClient.scoutReport.count({
      where: {
        teamMatchData: {
          teamNumber: params.team,
        },
      },
    });
    if (reportCount === 0) {
      return { error: "NO_DATA_FOR_TEAM" };
    }

    let notesAndMatches: {
      notes: string;
      match: string;
      tounramentName: string; // Typo for backwards compatibility
      sourceTeam: number;
      scouterName?: string;
    }[];

    const sourceTnmtFilter = dataSourceRuleToPrismaFilter(
      dataSourceRuleSchema(z.string()).parse(ctx.user.tournamentSourceRule),
    );
    const sourceTeamFilter = dataSourceRuleToPrismaFilter(
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

    const notesAndMatch = notesAndMatches.map(
      (entry) => `${entry.match}: ${entry.notes}`,
    );
    // const notesAndMatch = [
    //   "2023miket_qm1: Great autonomous mode.",
    //   "2023miket_qm2: Needs improvement in defense.",
    //   "2023miket_qm3: Excellent teamwork.",
    //   "2023miket_qm4: Struggles with climbing.",
    //   "2023miket_qm5: Consistent scoring ability.",
    //   "2023miket_qm6: Good communication on the field.",
    //   "2023miket_qm7: Fast and agile robot.",
    //   "2023miket_qm8: Issues with ball handling.",
    //   "2023miket_qm9: Strong alliance partner.",
    //   "2023miket_qm10: Innovative design features.",
    //   "2023miket_qm11: Reliable performance under pressure.",
    //   "2023miket_qm12: Needs better strategy execution.",
    //   "2023miket_qm13: Excellent driver skills.",
    //   "2023miket_qm14: Mechanical issues during match.",
    //   "2023miket_qm15: Great defense against opponents.",
    //   "2023miket_qm16: High scoring potential.",
    //   "2023miket_qm17: Insane autonomous performance.",
    //   "2023miket_qm18: Strong endgame performance.",
    //   "2023miket_qm19: Good adaptability to different strategies.",
    //   "2023miket_qm20: Robot broke and was immobile",
    // ].map((entry) => entry);

    const aiSummary = await getNoteSummary(params.team, notesAndMatch);

    return { notesAndMatches, aiSummary };
  },
});
