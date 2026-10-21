import { CustomFieldType, User } from "@prisma/client";
import z from "zod";
import prismaClient from "../../../prismaClient.js";
import { runAnalysis, AnalysisFunctionConfig } from "../analysisFunction.js";
import {
  getActiveCustomFields,
  getTournamentSourceRule,
  teamSourceRuleAllowsOwnTeam,
  tournamentRuleToSqlCondition,
} from "./customFieldShared.js";

/**
 * Breakdown-style distribution of the viewer's active SINGLE_SELECT and
 * MULTI_SELECT custom fields for one scouted team. Viewer-scoped: only reports
 * submitted by the viewer's own team count, and viewerTeam is part of the
 * cache key and its teamDependencies.
 *
 * Percentages: denominator is the number of answered reports for the field —
 * SINGLE_SELECT sums to 1, MULTI_SELECT may exceed 1. All of the field's
 * current options are seeded at 0; stale selections (options since removed
 * from the field) are still included under their original value.
 */

const argsSchema = z.object({
  viewerTeam: z.number(),
  team: z.number(),
});

const returnSchema = z.object({
  fields: z.array(
    z.object({
      uuid: z.string(),
      name: z.string(),
      order: z.number(),
      type: z.nativeEnum(CustomFieldType),
      options: z.array(z.string()),
      answerCount: z.number(),
      percentages: z.record(z.string(), z.number()),
    }),
  ),
});

type SelectionRow = {
  fieldUuid: string;
  selection: string;
  selectionCount: number;
  answerCount: number;
};

const config: AnalysisFunctionConfig<typeof argsSchema, typeof returnSchema> = {
  argsSchema,
  returnSchema,
  usesDataSource: true,
  shouldCache: true,

  createKey: (args) => ({
    key: [
      "customFieldSelectDistribution",
      String(args.viewerTeam),
      String(args.team),
    ],
    teamDependencies: Array.from(new Set([args.viewerTeam, args.team])),
    tournamentDependencies: [],
  }),

  calculateAnalysis: async (args, ctx) => {
    if (
      ctx.user.teamNumber !== args.viewerTeam ||
      !teamSourceRuleAllowsOwnTeam(ctx.user)
    ) {
      return { fields: [] };
    }

    // Ownership: only the viewer team's own active select fields
    const fields = await getActiveCustomFields(args.viewerTeam, [
      CustomFieldType.SINGLE_SELECT,
      CustomFieldType.MULTI_SELECT,
    ]);
    if (fields.length === 0) return { fields: [] };

    const tournamentRule = getTournamentSourceRule(ctx.user);
    const tournamentCondition = tournamentRuleToSqlCondition(
      tournamentRule,
      `tmd."tournamentKey"`,
      4,
    );

    const query = `
      WITH filtered AS (
        SELECT a."fieldUuid", a."selections"
        FROM "CustomFieldAnswer" a
        JOIN "ScoutReport" sr ON sr."uuid" = a."scoutReportUuid"
        JOIN "Scouter" sc ON sc."uuid" = sr."scouterUuid"
        JOIN "TeamMatchData" tmd ON tmd."key" = sr."teamMatchKey"
        WHERE a."fieldUuid" = ANY($1::text[])
          AND sc."sourceTeamNumber" = $2
          AND tmd."teamNumber" = $3
          AND cardinality(a."selections") > 0
          AND ${tournamentCondition.clause}
      ),
      counts AS (
        SELECT "fieldUuid", COUNT(*)::float AS "answerCount"
        FROM filtered
        GROUP BY "fieldUuid"
      )
      SELECT f."fieldUuid",
             sel.value AS "selection",
             COUNT(*)::float AS "selectionCount",
             c."answerCount"
      FROM filtered f
      CROSS JOIN UNNEST(f."selections") AS sel(value)
      JOIN counts c ON c."fieldUuid" = f."fieldUuid"
      GROUP BY f."fieldUuid", sel.value, c."answerCount"
    `;

    const rows = await prismaClient.$queryRawUnsafe<SelectionRow[]>(
      query,
      fields.map((field) => field.uuid),
      args.viewerTeam,
      args.team,
      tournamentCondition.param,
    );

    const rowsByField: Record<string, SelectionRow[]> = {};
    for (const row of rows) {
      (rowsByField[row.fieldUuid] ??= []).push(row);
    }

    return {
      fields: fields.map((field) => {
        const fieldRows = rowsByField[field.uuid] ?? [];
        const answerCount = fieldRows.length > 0 ? fieldRows[0].answerCount : 0;

        // Seed all current options at 0 so every option shows up
        const percentages: Record<string, number> = {};
        for (const option of field.options) {
          percentages[option] = 0;
        }
        for (const row of fieldRows) {
          percentages[row.selection] =
            answerCount > 0 ? row.selectionCount / answerCount : 0;
        }

        return {
          uuid: field.uuid,
          name: field.name,
          order: field.order,
          type: field.type,
          options: field.options,
          answerCount: answerCount,
          percentages: percentages,
        };
      }),
    };
  },
};

export type CustomFieldSelectDistributionResult = z.infer<typeof returnSchema>;

export const customFieldSelectDistribution = async (
  user: User,
  args: z.infer<typeof argsSchema>,
): Promise<CustomFieldSelectDistributionResult> =>
  runAnalysis(config, user, args);
