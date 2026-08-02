import { CustomFieldType, User } from "@prisma/client";
import z from "zod";
import prismaClient from "../../../prismaClient.js";
import { allTeamNumbers } from "../analysisConstants.js";
import { runAnalysis, AnalysisFunctionConfig } from "../analysisFunction.js";
import { avg } from "../coreAnalysis/averageManyFast.js";
import { weightedTourAvgLeft } from "../coreAnalysis/arrayAndAverageTeams.js";
import {
  getTournamentSourceRule,
  teamSourceRuleAllowsOwnTeam,
  tournamentRuleToSqlCondition,
} from "./customFieldShared.js";

/**
 * Custom NUMBER field aggregates. All functions are viewer-scoped: answers are
 * only ever read from reports submitted by the viewer's own team
 * (sourceTeamNumber = viewerTeam), fields must belong to viewerTeam, and
 * viewerTeam is part of every cache key and its teamDependencies.
 * Aggregation matches existing metrics: per-match AVG across reports, then
 * per-tournament AVG, then weightedTourAvgLeft across tournaments
 * (oldest first).
 */

type MatchAvgRow = {
  fieldUuid: string;
  teamNumber: number;
  tournamentKey: string;
  tournamentName: string;
  matchKey: string;
  matchAvg: number;
};

// Per-match averages for the given fields/teams, ordered oldest tournament
// first (then match order within each tournament)
const fetchMatchAverages = async (
  user: User,
  fieldUuids: string[],
  viewerTeam: number,
  teams: number[] | null,
): Promise<MatchAvgRow[]> => {
  const tournamentRule = getTournamentSourceRule(user);
  const tournamentCondition = tournamentRuleToSqlCondition(
    tournamentRule,
    `tmd."tournamentKey"`,
    teams === null ? 3 : 4,
  );

  const teamCondition =
    teams === null ? "" : `AND tmd."teamNumber" = ANY($3::int[])`;

  const query = `
    SELECT a."fieldUuid",
           tmd."teamNumber",
           tmd."tournamentKey",
           t."name" AS "tournamentName",
           tmd."key" AS "matchKey",
           AVG(a."numberValue")::float AS "matchAvg"
    FROM "CustomFieldAnswer" a
    JOIN "ScoutReport" sr ON sr."uuid" = a."scoutReportUuid"
    JOIN "Scouter" sc ON sc."uuid" = sr."scouterUuid"
    JOIN "TeamMatchData" tmd ON tmd."key" = sr."teamMatchKey"
    JOIN "Tournament" t ON t."key" = tmd."tournamentKey"
    WHERE a."fieldUuid" = ANY($1::text[])
      AND a."numberValue" IS NOT NULL
      AND sc."sourceTeamNumber" = $2
      ${teamCondition}
      AND ${tournamentCondition.clause}
    GROUP BY a."fieldUuid", tmd."teamNumber", tmd."tournamentKey", t."name", t."date", tmd."key", tmd."matchType", tmd."matchNumber"
    ORDER BY t."date" ASC, tmd."tournamentKey" ASC, tmd."teamNumber" ASC, tmd."matchType" ASC, tmd."matchNumber" ASC
  `;

  const params: unknown[] =
    teams === null
      ? [fieldUuids, viewerTeam, tournamentCondition.param]
      : [fieldUuids, viewerTeam, teams, tournamentCondition.param];

  return prismaClient.$queryRawUnsafe<MatchAvgRow[]>(query, ...params);
};

// Owned NUMBER-field uuids among the requested ones (archived included so
// direct cf_ lookups keep working)
const verifyOwnedNumberFields = async (
  fieldUuids: string[],
  viewerTeam: number,
): Promise<Set<string>> => {
  if (fieldUuids.length === 0) return new Set();
  const fields = await prismaClient.customField.findMany({
    where: {
      uuid: { in: fieldUuids },
      teamNumber: viewerTeam,
      type: CustomFieldType.NUMBER,
    },
    select: { uuid: true },
  });
  return new Set(fields.map((field) => field.uuid));
};

const dedupe = (teams: number[]): number[] => Array.from(new Set(teams));

/* ------------------- customFieldNumberManyFast ------------------- */

const manyFastArgsSchema = z.object({
  viewerTeam: z.number(),
  teams: z.array(z.number()),
  fieldUuids: z.array(z.string()),
});

const manyFastReturnSchema = z.record(
  z.string(),
  z.record(z.string(), z.number().nullable()),
);

const manyFastConfig: AnalysisFunctionConfig<
  typeof manyFastArgsSchema,
  typeof manyFastReturnSchema
> = {
  argsSchema: manyFastArgsSchema,
  returnSchema: manyFastReturnSchema,
  usesDataSource: true,
  shouldCache: true,

  createKey: (args) => ({
    key: [
      "customFieldNumberManyFast",
      String(args.viewerTeam),
      JSON.stringify([...args.teams].sort((a, b) => a - b)),
      JSON.stringify([...args.fieldUuids].sort()),
    ],
    teamDependencies: dedupe([args.viewerTeam, ...args.teams]),
    tournamentDependencies: [],
  }),

  calculateAnalysis: async (args, ctx) => {
    // Stable shape: every requested field key present, every team null-seeded
    const result: Record<string, Record<string, number | null>> = {};
    for (const fieldUuid of args.fieldUuids) {
      result[fieldUuid] = {};
      for (const team of args.teams) {
        result[fieldUuid][String(team)] = null;
      }
    }

    if (
      ctx.user.teamNumber !== args.viewerTeam ||
      !teamSourceRuleAllowsOwnTeam(ctx.user)
    ) {
      return result;
    }

    const ownedUuids = await verifyOwnedNumberFields(
      args.fieldUuids,
      args.viewerTeam,
    );
    if (ownedUuids.size === 0 || args.teams.length === 0) return result;

    const rows = await fetchMatchAverages(
      ctx.user,
      Array.from(ownedUuids),
      args.viewerTeam,
      args.teams,
    );

    // field -> team -> tournament -> match values (tournaments oldest first)
    const grouped: Record<string, Record<number, Map<string, number[]>>> = {};
    for (const row of rows) {
      if (!ownedUuids.has(row.fieldUuid)) continue;
      grouped[row.fieldUuid] ??= {};
      grouped[row.fieldUuid][row.teamNumber] ??= new Map();
      const byTournament = grouped[row.fieldUuid][row.teamNumber];
      if (!byTournament.has(row.tournamentKey)) {
        byTournament.set(row.tournamentKey, []);
      }
      byTournament.get(row.tournamentKey).push(row.matchAvg);
    }

    for (const fieldUuid of Object.keys(grouped)) {
      for (const team of args.teams) {
        const byTournament = grouped[fieldUuid][team];
        if (!byTournament) continue;
        const tournamentAverages = Array.from(byTournament.values()).map(avg);
        if (tournamentAverages.length > 0) {
          result[fieldUuid][String(team)] =
            weightedTourAvgLeft(tournamentAverages);
        }
      }
    }

    return result;
  },
};

export type CustomFieldNumberManyFastResult = z.infer<
  typeof manyFastReturnSchema
>;

/**
 * Weighted tournament averages for many teams x many custom NUMBER fields.
 * Returns { [fieldUuid]: { [teamNumber]: average | null } }; null when the
 * team has no answers for the field (or the field isn't the viewer's).
 */
export const customFieldNumberManyFast = async (
  user: User,
  args: z.infer<typeof manyFastArgsSchema>,
): Promise<CustomFieldNumberManyFastResult> =>
  runAnalysis(manyFastConfig, user, args);

/* -------------------- customFieldNumberTeams --------------------- */

const teamsArgsSchema = z.object({
  viewerTeam: z.number(),
  teams: z.array(z.number()),
  fieldUuid: z.string(),
});

const teamsReturnSchema = z.record(
  z.string(),
  z.object({
    average: z.number().nullable(),
    timeLine: z.array(
      z.object({
        match: z.string(),
        dataPoint: z.number(),
        tournamentName: z.string(),
      }),
    ),
  }),
);

const teamsConfig: AnalysisFunctionConfig<
  typeof teamsArgsSchema,
  typeof teamsReturnSchema
> = {
  argsSchema: teamsArgsSchema,
  returnSchema: teamsReturnSchema,
  usesDataSource: true,
  shouldCache: true,

  createKey: (args) => ({
    key: [
      "customFieldNumberTeams",
      String(args.viewerTeam),
      JSON.stringify([...args.teams].sort((a, b) => a - b)),
      args.fieldUuid,
    ],
    teamDependencies: dedupe([args.viewerTeam, ...args.teams]),
    tournamentDependencies: [],
  }),

  calculateAnalysis: async (args, ctx) => {
    const result: z.infer<typeof teamsReturnSchema> = {};
    for (const team of args.teams) {
      result[String(team)] = { average: null, timeLine: [] };
    }

    if (
      ctx.user.teamNumber !== args.viewerTeam ||
      !teamSourceRuleAllowsOwnTeam(ctx.user)
    ) {
      return result;
    }

    const ownedUuids = await verifyOwnedNumberFields(
      [args.fieldUuid],
      args.viewerTeam,
    );
    if (!ownedUuids.has(args.fieldUuid) || args.teams.length === 0) {
      return result;
    }

    const rows = await fetchMatchAverages(
      ctx.user,
      [args.fieldUuid],
      args.viewerTeam,
      args.teams,
    );

    // team -> tournament -> match values (tournaments oldest first)
    const grouped: Record<number, Map<string, number[]>> = {};
    for (const row of rows) {
      grouped[row.teamNumber] ??= new Map();
      const byTournament = grouped[row.teamNumber];
      if (!byTournament.has(row.tournamentKey)) {
        byTournament.set(row.tournamentKey, []);
      }
      byTournament.get(row.tournamentKey).push(row.matchAvg);

      result[String(row.teamNumber)]?.timeLine.push({
        match: row.matchKey,
        dataPoint: row.matchAvg,
        tournamentName: row.tournamentName,
      });
    }

    for (const team of args.teams) {
      const byTournament = grouped[team];
      if (!byTournament) continue;
      const tournamentAverages = Array.from(byTournament.values()).map(avg);
      if (tournamentAverages.length > 0) {
        result[String(team)].average = weightedTourAvgLeft(tournamentAverages);
      }
    }

    return result;
  },
};

export type CustomFieldNumberTeamsResult = z.infer<typeof teamsReturnSchema>;

/**
 * Per-team weighted average + match timeline for one custom NUMBER field
 * (archived fields resolve so old links keep working). Shape mirrors
 * arrayAndAverageTeams: { [teamNumber]: { average, timeLine } }.
 */
export const customFieldNumberTeams = async (
  user: User,
  args: z.infer<typeof teamsArgsSchema>,
): Promise<CustomFieldNumberTeamsResult> =>
  runAnalysis(teamsConfig, user, args);

/* --------------------- customFieldNumberAll ---------------------- */

const allArgsSchema = z.object({
  viewerTeam: z.number(),
  fieldUuid: z.string(),
});

const allReturnSchema = z.number().nullable();

const allConfig: AnalysisFunctionConfig<
  typeof allArgsSchema,
  typeof allReturnSchema
> = {
  argsSchema: allArgsSchema,
  returnSchema: allReturnSchema,
  usesDataSource: true,
  shouldCache: true,

  createKey: async (args) => ({
    key: ["customFieldNumberAll", String(args.viewerTeam), args.fieldUuid],
    teamDependencies: dedupe([args.viewerTeam, ...(await allTeamNumbers)]),
    tournamentDependencies: [],
  }),

  calculateAnalysis: async (args, ctx) => {
    if (
      ctx.user.teamNumber !== args.viewerTeam ||
      !teamSourceRuleAllowsOwnTeam(ctx.user)
    ) {
      return null;
    }

    const ownedUuids = await verifyOwnedNumberFields(
      [args.fieldUuid],
      args.viewerTeam,
    );
    if (!ownedUuids.has(args.fieldUuid)) return null;

    const rows = await fetchMatchAverages(
      ctx.user,
      [args.fieldUuid],
      args.viewerTeam,
      null, // all teams
    );

    if (rows.length === 0) return null;

    // tournament -> match values across all teams (tournaments oldest first)
    const byTournament = new Map<string, number[]>();
    for (const row of rows) {
      if (!byTournament.has(row.tournamentKey)) {
        byTournament.set(row.tournamentKey, []);
      }
      byTournament.get(row.tournamentKey).push(row.matchAvg);
    }

    const tournamentAverages = Array.from(byTournament.values()).map(avg);
    return tournamentAverages.length > 0
      ? weightedTourAvgLeft(tournamentAverages)
      : null;
  },
};

/**
 * Weighted average of one custom NUMBER field across every scouted team
 * (the "all" comparison value on details pages). null when no data or the
 * field isn't the viewer's.
 */
export const customFieldNumberAll = async (
  user: User,
  args: z.infer<typeof allArgsSchema>,
): Promise<number | null> => runAnalysis(allConfig, user, args);
