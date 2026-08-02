import z from "zod";
import { CustomFieldType } from "@prisma/client";
import {
  allTeamNumbers,
  allTournaments,
  AnalysisContext,
  breakdownNeg,
  breakdownPos,
  dashboardToServer,
} from "../analysisConstants.js";
import { createAnalysisHandler } from "../analysisHandler.js";
import {
  dataSourceRuleSchema,
  dataSourceRuleToArray,
} from "../dataSourceRule.js";
import prismaClient from "../../../prismaClient.js";
import {
  getTournamentSourceRule,
  parseCfKey,
  teamSourceRuleAllowsOwnTeam,
  tournamentRuleToSqlCondition,
} from "../customFields/customFieldShared.js";

export const breakdownDetails = createAnalysisHandler({
  params: {
    params: z.object({
      team: z.preprocess((x) => Number(x), z.number()),
      breakdown: z.string(),
    }),
  },
  usesDataSource: true,
  shouldCache: true,
  createKey: async ({ params }, ctx) => {
    const key = [
      "breakdownDetails",
      params.team.toString(),
      params.breakdown.toString(),
    ];
    const teamDependencies = [params.team];

    // cf_ breakdowns are viewer-scoped: fragment the key by viewer team (no
    // key change at all for ordinary breakdowns) and depend on the viewer team
    // so custom field config mutations invalidate the row.
    if (parseCfKey(params.breakdown) !== null) {
      key.push(`viewer${ctx.user.teamNumber ?? "none"}`);
      if (
        ctx.user.teamNumber !== null &&
        ctx.user.teamNumber !== undefined &&
        !teamDependencies.includes(ctx.user.teamNumber)
      ) {
        teamDependencies.push(ctx.user.teamNumber);
      }
    }

    return {
      key: key,
      teamDependencies: teamDependencies,
      tournamentDependencies: [],
    };
  },
  calculateAnalysis: async ({ params }, ctx) => {
    const cfUuid = parseCfKey(params.breakdown);
    if (cfUuid !== null) {
      return customFieldBreakdownDetails(cfUuid, params.team, ctx);
    }
    const queryStr = `
        SELECT "${dashboardToServer[params.breakdown]}" AS breakdown,
            "teamMatchKey" AS key,
            tmnt."name" AS tournament,
            sc."sourceTeamNumber" AS sourceteam,
            teamScouter."name" AS scouter
        FROM "ScoutReport" s
        JOIN "Scouter" sc ON sc."uuid" = s."scouterUuid"
        JOIN "TeamMatchData" tmd
            ON tmd."teamNumber" = ${params.team}
            AND tmd."key" = s."teamMatchKey"
            AND sc."sourceTeamNumber" = ANY($1)
            AND tmd."tournamentKey" = ANY($2)
        JOIN "Tournament" tmnt ON tmd."tournamentKey" = tmnt."key"
        LEFT JOIN "Scouter" teamScouter
            ON teamScouter."uuid" = s."scouterUuid"
            AND teamScouter."sourceTeamNumber" = ${ctx.user.teamNumber}
        ORDER BY tmnt."date" DESC, tmd."matchType" DESC, tmd."matchNumber" DESC
        `;
    interface QueryRow {
      breakdown: string;
      key: string;
      tournament: string;
      sourceteam: string;
      scouter: string;
    }

    const data = await prismaClient.$queryRawUnsafe<QueryRow[]>(
      queryStr,
      dataSourceRuleToArray(
        dataSourceRuleSchema(z.number()).parse(ctx.user.teamSourceRule),
        await allTeamNumbers,
      ),
      dataSourceRuleToArray(
        dataSourceRuleSchema(z.string()).parse(ctx.user.tournamentSourceRule),
        await allTournaments,
      ),
    );

    // Edit to work with true/false breakdowns
    const transformBreakdown = (input): string => {
      switch (input) {
        case true:
          return breakdownPos;
        case false:
          return breakdownNeg;
        default:
          return input;
      }
    };

    const parsePgArray = (input: unknown): string[] => {
      if (input == null) return [];
      if (Array.isArray(input)) return input.map(String);
      const str = String(input);
      const trimmed = str.trim();
      if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
        const inner = trimmed.slice(1, -1);
        return inner
          .split(",")
          .map((s) => s.trim().replace(/^"|"$/g, ""))
          .filter((s) => s.length > 0);
      }
      return trimmed.length ? [trimmed] : [];
    };

    const breakdownField = dashboardToServer[params.breakdown];
    const isArrayBreakdown =
      breakdownField === "robotRoles" || breakdownField === "feederTypes";

    const result: {
      key: string;
      tournamentName: string;
      breakdown: string;
      sourceTeam: string;
      scouter?: string;
    }[] = [];

    for (const match of data) {
      if (isArrayBreakdown) {
        const items = parsePgArray(match.breakdown);
        for (const item of items) {
          result.push({
            key: match.key,
            tournamentName: match.tournament,
            breakdown: item,
            sourceTeam: match.sourceteam,
            scouter: match.scouter ?? undefined,
          });
        }
      } else {
        result.push({
          key: match.key,
          tournamentName: match.tournament,
          breakdown: transformBreakdown(match.breakdown),
          sourceTeam: match.sourceteam,
          scouter: match.scouter ?? undefined,
        });
      }
    }

    return result;
  },
});

/**
 * cf_ branch of breakdownDetails: expands one row per stored selection of the
 * viewer's custom select field for the scouted team. Viewer-scoped — only
 * reports submitted by the viewer's own team count; the field must belong to
 * the viewer and be a select type (archived allowed so old links keep
 * working), otherwise empty.
 */
async function customFieldBreakdownDetails(
  fieldUuid: string,
  team: number,
  ctx: AnalysisContext,
): Promise<
  {
    key: string;
    tournamentName: string;
    breakdown: string;
    sourceTeam: string;
    scouter?: string;
  }[]
> {
  const viewerTeam = ctx.user.teamNumber;
  if (viewerTeam === null || viewerTeam === undefined) return [];
  if (!teamSourceRuleAllowsOwnTeam(ctx.user)) return [];

  const field = await prismaClient.customField.findUnique({
    where: { uuid: fieldUuid },
  });
  if (
    !field ||
    field.teamNumber !== viewerTeam ||
    (field.type !== CustomFieldType.SINGLE_SELECT &&
      field.type !== CustomFieldType.MULTI_SELECT)
  ) {
    return [];
  }

  const tournamentRule = getTournamentSourceRule(ctx.user);
  const tournamentCondition = tournamentRuleToSqlCondition(
    tournamentRule,
    `tmd."tournamentKey"`,
    4,
  );

  const queryStr = `
      SELECT sel.value AS breakdown,
          sr."teamMatchKey" AS key,
          tmnt."name" AS tournament,
          sc."sourceTeamNumber" AS sourceteam,
          sc."name" AS scouter
      FROM "CustomFieldAnswer" a
      JOIN "ScoutReport" sr ON sr."uuid" = a."scoutReportUuid"
      JOIN "Scouter" sc ON sc."uuid" = sr."scouterUuid"
      JOIN "TeamMatchData" tmd ON tmd."key" = sr."teamMatchKey"
      JOIN "Tournament" tmnt ON tmnt."key" = tmd."tournamentKey"
      CROSS JOIN UNNEST(a."selections") AS sel(value)
      WHERE a."fieldUuid" = $1
          AND sc."sourceTeamNumber" = $2
          AND tmd."teamNumber" = $3
          AND ${tournamentCondition.clause}
      ORDER BY tmnt."date" DESC, tmd."matchType" DESC, tmd."matchNumber" DESC
      `;

  interface QueryRow {
    breakdown: string;
    key: string;
    tournament: string;
    sourceteam: string;
    scouter: string;
  }

  const data = await prismaClient.$queryRawUnsafe<QueryRow[]>(
    queryStr,
    fieldUuid,
    viewerTeam,
    team,
    tournamentCondition.param,
  );

  return data.map((match) => ({
    key: match.key,
    tournamentName: match.tournament,
    breakdown: match.breakdown,
    sourceTeam: match.sourceteam,
    scouter: match.scouter ?? undefined,
  }));
}
