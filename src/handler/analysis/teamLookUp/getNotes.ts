import prismaClient from "../../../prismaClient.js";
import z from "zod";
import { CustomFieldType } from "@prisma/client";
import {
  dataSourceRuleSchema,
  dataSourceRuleToPrismaFilter,
} from "../dataSourceRule.js";
import { createAnalysisHandler } from "../analysisHandler.js";

export const getNotes = createAnalysisHandler({
  params: {
    params: z.object({
      team: z.preprocess((x) => Number(x), z.number()),
    }),
  },
  usesDataSource: true,
  shouldCache: true,
  createKey: async ({ params }) => {
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
      robotBrokeDescription?: string;
      match: string;
      tournamentName: string;
      sourceTeam: number;
      scouterName?: string;
      // Free-form ("Text") custom field answers for this report, in canonical
      // field order. Displayed inline with the note, each labeled with its
      // question, so they follow the same data-source scoping as notes rather
      // than the stricter own-team scoping used by aggregate custom surfaces.
      customTextAnswers: { name: string; value: string }[];
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
        // Include a report if it has a written note OR at least one answered
        // text custom field, so text-only reports still get a card.
        OR: [
          { notes: { not: "" } },
          {
            customFieldAnswers: {
              some: {
                // Archived fields included: their answers are historical free
                // text worth keeping in the notes view, like on raw reports.
                field: { type: CustomFieldType.TEXT },
                textValue: { not: null },
              },
            },
          },
        ],
      },
      select: {
        notes: true,
        robotBrokeDescription: true,
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
        customFieldAnswers: {
          where: {
            field: { type: CustomFieldType.TEXT },
            textValue: { not: null },
          },
          select: {
            textValue: true,
            field: {
              select: {
                name: true,
                order: true,
                createdAt: true,
                uuid: true,
              },
            },
          },
        },
      },
      orderBy: [
        { teamMatchData: { tournament: { date: "desc" } } },
        { teamMatchData: { matchType: "desc" } },
        { teamMatchData: { matchNumber: "desc" } },
      ],
    });

    // Text answers, blank-filtered and sorted into canonical field order.
    const customTextAnswersFor = (report: (typeof noteData)[number]) =>
      report.customFieldAnswers
        .filter((answer) => (answer.textValue ?? "").trim() !== "")
        .sort(
          (a, b) =>
            a.field.order - b.field.order ||
            a.field.createdAt.getTime() - b.field.createdAt.getTime() ||
            (a.field.uuid < b.field.uuid
              ? -1
              : a.field.uuid > b.field.uuid
                ? 1
                : 0),
        )
        .map((answer) => ({
          name: answer.field.name,
          value: (answer.textValue ?? "").trim(),
        }));

    if (Boolean(ctx.user.teamNumber)) {
      notesAndMatches = noteData.map((report) => ({
        notes: report.notes,
        match: report.teamMatchKey,
        robotBrokeDescription: report.robotBrokeDescription,
        tournamentName: report.teamMatchData.tournament.name,
        sourceTeam: report.scouter.sourceTeamNumber,
        scouterName:
          report.scouter.sourceTeamNumber === ctx.user.teamNumber
            ? report.scouter.name
            : undefined,
        customTextAnswers: customTextAnswersFor(report),
      }));
    } else {
      notesAndMatches = noteData.map((report) => ({
        notes: report.notes,
        match: report.teamMatchKey,
        robotBrokeDescription: report.robotBrokeDescription,
        tournamentName: report.teamMatchData.tournament.name,
        sourceTeam: report.scouter.sourceTeamNumber,
        customTextAnswers: customTextAnswersFor(report),
      }));
    }

    return notesAndMatches;
  },
});
