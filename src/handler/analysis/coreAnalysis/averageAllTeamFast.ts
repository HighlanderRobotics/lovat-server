import prismaClient from "../../../prismaClient.js";
import {
  accuracyToPercentageInterpolated,
  allTeamNumbers,
  autoEnd,
  endgameToPoints,
  Metric,
  metricToEvent,
  minActionDuration,
} from "../analysisConstants.js";
import z from "zod";
import {
  dataSourceRuleToPrismaFilter,
  dataSourceRuleSchema,
} from "../dataSourceRule.js";
import { runAnalysis } from "../analysisFunction.js";
import { weightedTourAvgLeft } from "./arrayAndAverageTeams.js";

// ---------------------------------------------------------------------------
// Helpers to convert a Prisma filter shape → SQL fragment + params
// ---------------------------------------------------------------------------

type PrismaFilter<T> = { in?: T[]; notIn?: T[] } | undefined;

/**
 * Returns a SQL snippet like `= ANY($N::text[])` or `!= ALL($N::text[])`,
 * plus the array value to bind at position N.
 *
 * @param filter   Result of dataSourceRuleToPrismaFilter
 * @param cast     Postgres cast string, e.g. "text[]" or "int[]"
 * @param col      Fully-qualified column reference, e.g. `tmd."tournamentKey"`
 * @param startIdx 1-based index for the first new $N placeholder
 * @returns        { clause, param, nextIdx }
 *                 clause is empty string if filter is undefined (no restriction)
 */
function filterToSql<T extends string | number>(
  filter: PrismaFilter<T>,
  cast: string,
  col: string,
  startIdx: number,
): { clause: string; param: T[] | null; nextIdx: number } {
  if (!filter) return { clause: "", param: null, nextIdx: startIdx };
  if (filter.in) {
    return {
      clause: `AND ${col} = ANY($${startIdx}::${cast})`,
      param: filter.in,
      nextIdx: startIdx + 1,
    };
  }
  if (filter.notIn) {
    return {
      clause: `AND ${col} != ALL($${startIdx}::${cast})`,
      param: filter.notIn,
      nextIdx: startIdx + 1,
    };
  }
  return { clause: "", param: null, nextIdx: startIdx };
}

/** Build the positional params array, skipping nulls */
function buildParams(...maybeParams: (unknown[] | null)[]): unknown[] {
  return maybeParams.filter((p): p is unknown[] => p !== null);
}

// ---------------------------------------------------------------------------

const config = {
  argsSchema: z.object({ metric: z.nativeEnum(Metric) }),
  usesDataSource: true,
  shouldCache: true,
  createKey: async (args: { metric: Metric }) => {
    const metric = args.metric;
    return {
      key: ["averageAllTeamFast", String(metric)],
      teamDependencies: await allTeamNumbers,
      tournamentDependencies: [],
    };
  },
  calculateAnalysis: async (
    args: { metric: Metric },
    ctx: { user: { teamSourceRule: unknown; tournamentSourceRule: unknown } },
  ) => {
    const metric = args.metric;

    const sourceTnmtRule = dataSourceRuleSchema(z.string()).parse(
      ctx.user.tournamentSourceRule,
    );
    const sourceTeamRule = dataSourceRuleSchema(z.number()).parse(
      ctx.user.teamSourceRule,
    );

    // Prisma-compatible filter objects (used only where safe / no bind-var risk)
    const sourceTnmtFilter =
      dataSourceRuleToPrismaFilter<string>(sourceTnmtRule);
    const sourceTeamFilter =
      dataSourceRuleToPrismaFilter<number>(sourceTeamRule);

    // SQL helpers for the two filters
    const tnmtSql = (col: string, idx: number) =>
      filterToSql(sourceTnmtFilter, "text[]", col, idx);
    const teamSql = (col: string, idx: number) =>
      filterToSql(sourceTeamFilter, "int[]", col, idx);

    // ------------------------------------------------------------------
    // driverAbility
    // ------------------------------------------------------------------
    if (metric === Metric.driverAbility) {
      const t = tnmtSql(`tmd."tournamentKey"`, 1);
      const s = teamSql(`sct."sourceTeamNumber"`, t.nextIdx);
      const params = buildParams(t.param, s.param);

      const raw = await prismaClient.$queryRawUnsafe<
        { tournamentKey: string; driverAbility: number | null }[]
      >(
        `SELECT tmd."tournamentKey", sr."driverAbility"
         FROM "TeamMatchData" tmd
         JOIN "ScoutReport" sr ON sr."teamMatchKey" = tmd."key"
         JOIN "Scouter" sct    ON sct."uuid" = sr."scouterUuid"
         WHERE 1=1 ${t.clause} ${s.clause}`,
        ...params,
      );

      if (raw.length === 0) return 0;

      const byTournament: Record<string, number[]> = {};
      for (const row of raw) {
        if (row.driverAbility == null) continue;
        (byTournament[row.tournamentKey] ??= []).push(row.driverAbility);
      }
      const perTournamentAvg = Object.values(byTournament).map(
        (vals) => vals.reduce((a, b) => a + b, 0) / vals.length,
      );
      return perTournamentAvg.length
        ? weightedTourAvgLeft(perTournamentAvg)
        : 0;
    }

    // ------------------------------------------------------------------
    // accuracy
    // ------------------------------------------------------------------
    if (metric === Metric.accuracy) {
      const t = tnmtSql(`tmd."tournamentKey"`, 1);
      const s = teamSql(`sct."sourceTeamNumber"`, t.nextIdx);
      const params = buildParams(t.param, s.param);

      const raw = await prismaClient.$queryRawUnsafe<
        { tournamentKey: string; accuracy: number | null }[]
      >(
        `SELECT tmd."tournamentKey", sr."accuracy"
         FROM "TeamMatchData" tmd
         JOIN "ScoutReport" sr ON sr."teamMatchKey" = tmd."key"
         JOIN "Scouter" sct    ON sct."uuid" = sr."scouterUuid"
         WHERE 1=1 ${t.clause} ${s.clause}`,
        ...params,
      );

      if (raw.length === 0) return 0;

      const byTournament: Record<string, number[]> = {};
      for (const row of raw) {
        const pct = accuracyToPercentageInterpolated(row.accuracy);
        if (typeof pct !== "number") continue;
        (byTournament[row.tournamentKey] ??= []).push(pct);
      }
      const perTournamentAvg = Object.values(byTournament).map(
        (vals) => vals.reduce((a, b) => a + b, 0) / vals.length,
      );
      return perTournamentAvg.length
        ? weightedTourAvgLeft(perTournamentAvg)
        : 0;
    }

    // ------------------------------------------------------------------
    // fuelPerSecond
    // ------------------------------------------------------------------
    if (metric === Metric.fuelPerSecond) {
      const t = tnmtSql(`tmd."tournamentKey"`, 1);
      const s = teamSql(`sct."sourceTeamNumber"`, t.nextIdx);
      const params = buildParams(t.param, s.param);

      const raw = await prismaClient.$queryRawUnsafe<
        { action: string; quantity: number | null; time: number }[]
      >(
        `SELECT e."action", e."quantity", e."time"
         FROM "Event" e
         JOIN "ScoutReport" sr  ON sr."uuid" = e."scoutReportUuid"
         JOIN "TeamMatchData" tmd ON tmd."key" = sr."teamMatchKey"
         JOIN "Scouter" sct    ON sct."uuid" = sr."scouterUuid"
         WHERE e."action" IN ('START_SCORING','STOP_SCORING')
           ${t.clause} ${s.clause}`,
        ...params,
      );

      if (raw.length === 0) return 0;

      // Group events back into per-report buckets isn't possible without
      // scoutReportUuid — fetch that too
      const rawWithUuid = await prismaClient.$queryRawUnsafe<
        {
          scoutReportUuid: string;
          action: string;
          quantity: number | null;
          time: number;
        }[]
      >(
        `SELECT e."scoutReportUuid", e."action", e."quantity", e."time"
         FROM "Event" e
         JOIN "ScoutReport" sr  ON sr."uuid" = e."scoutReportUuid"
         JOIN "TeamMatchData" tmd ON tmd."key" = sr."teamMatchKey"
         JOIN "Scouter" sct    ON sct."uuid" = sr."scouterUuid"
         WHERE e."action" IN ('START_SCORING','STOP_SCORING')
           ${t.clause} ${s.clause}`,
        ...params,
      );

      const byReport: Record<string, typeof rawWithUuid> = {};
      for (const row of rawWithUuid) {
        (byReport[row.scoutReportUuid] ??= []).push(row);
      }

      const perReportRates = Object.values(byReport).map((events) => {
        const totalFuel = events
          .filter((e) => e.action === "STOP_SCORING")
          .reduce((acc, cur) => acc + (cur.quantity ?? 0), 0);
        const scoringEvents = events
          .filter(
            (e) => e.action === "START_SCORING" || e.action === "STOP_SCORING",
          )
          .sort((a, b) => a.time - b.time);
        let duration = 0;
        for (let i = 0; i < scoringEvents.length; i += 2) {
          const startEv = scoringEvents[i];
          const stopEv = scoringEvents[i + 1];
          if (startEv && stopEv) {
            const pairDuration = stopEv.time - startEv.time;
            if (pairDuration >= minActionDuration) duration += pairDuration;
          }
        }
        return duration > 0 ? totalFuel / duration : 0;
      });

      return perReportRates.length
        ? perReportRates.reduce((a, b) => a + b, 0) / perReportRates.length
        : 0;
    }

    // ------------------------------------------------------------------
    // totalFuelOutputted
    // ------------------------------------------------------------------
    if (metric === Metric.totalFuelOutputted) {
      const t = tnmtSql(`tmd."tournamentKey"`, 1);
      const s = teamSql(`sct."sourceTeamNumber"`, t.nextIdx);
      const params = buildParams(t.param, s.param);

      const raw = await prismaClient.$queryRawUnsafe<
        {
          tournamentKey: string;
          scoutReportUuid: string;
          action: string;
          quantity: number | null;
        }[]
      >(
        `SELECT tmd."tournamentKey", e."scoutReportUuid", e."action", e."quantity"
         FROM "Event" e
         JOIN "ScoutReport" sr  ON sr."uuid" = e."scoutReportUuid"
         JOIN "TeamMatchData" tmd ON tmd."key" = sr."teamMatchKey"
         JOIN "Scouter" sct    ON sct."uuid" = sr."scouterUuid"
         WHERE e."action" IN ('STOP_SCORING','STOP_FEEDING')
           ${t.clause} ${s.clause}`,
        ...params,
      );

      if (raw.length === 0) return 0;

      // Sum per report, then average per tournament
      const reportTotals: Record<
        string,
        { tournamentKey: string; total: number }
      > = {};
      for (const row of raw) {
        if (!reportTotals[row.scoutReportUuid]) {
          reportTotals[row.scoutReportUuid] = {
            tournamentKey: row.tournamentKey,
            total: 0,
          };
        }
        reportTotals[row.scoutReportUuid].total += row.quantity ?? 0;
      }

      const byTournament: Record<string, number[]> = {};
      for (const { tournamentKey, total } of Object.values(reportTotals)) {
        (byTournament[tournamentKey] ??= []).push(total);
      }
      const perTournamentAvg = Object.values(byTournament).map(
        (arr) => arr.reduce((a, b) => a + b, 0) / arr.length,
      );
      return perTournamentAvg.length
        ? weightedTourAvgLeft(perTournamentAvg)
        : 0;
    }

    // ------------------------------------------------------------------
    // totalBallThroughput
    // ------------------------------------------------------------------
    if (metric === Metric.totalBallThroughput) {
      const t = tnmtSql(`tmd."tournamentKey"`, 1);
      const s = teamSql(`sct."sourceTeamNumber"`, t.nextIdx);
      const params = buildParams(t.param, s.param);

      const raw = await prismaClient.$queryRawUnsafe<
        {
          tournamentKey: string;
          scoutReportUuid: string;
          quantity: number | null;
        }[]
      >(
        `SELECT tmd."tournamentKey", e."scoutReportUuid", e."quantity"
         FROM "Event" e
         JOIN "ScoutReport" sr  ON sr."uuid" = e."scoutReportUuid"
         JOIN "TeamMatchData" tmd ON tmd."key" = sr."teamMatchKey"
         JOIN "Scouter" sct    ON sct."uuid" = sr."scouterUuid"
         WHERE e."action" IN ('STOP_SCORING','STOP_FEEDING')
           ${t.clause} ${s.clause}`,
        ...params,
      );

      if (raw.length === 0) return 0;

      const reportTotals: Record<
        string,
        { tournamentKey: string; total: number }
      > = {};
      for (const row of raw) {
        if (!reportTotals[row.scoutReportUuid]) {
          reportTotals[row.scoutReportUuid] = {
            tournamentKey: row.tournamentKey,
            total: 0,
          };
        }
        reportTotals[row.scoutReportUuid].total += row.quantity ?? 0;
      }

      const byTournament: Record<string, number[]> = {};
      for (const { tournamentKey, total } of Object.values(reportTotals)) {
        (byTournament[tournamentKey] ??= []).push(total);
      }
      const perTournamentAvg = Object.values(byTournament).map(
        (arr) => arr.reduce((a, b) => a + b, 0) / arr.length,
      );
      return perTournamentAvg.length
        ? weightedTourAvgLeft(perTournamentAvg)
        : 0;
    }

    // ------------------------------------------------------------------
    // outpostIntakes
    // ------------------------------------------------------------------
    if (metric === Metric.outpostIntakes) {
      const t = tnmtSql(`tmd."tournamentKey"`, 1);
      const s = teamSql(`sct."sourceTeamNumber"`, t.nextIdx);
      const params = buildParams(t.param, s.param);

      const raw = await prismaClient.$queryRawUnsafe<
        { scoutReportUuid: string; count: bigint }[]
      >(
        `SELECT e."scoutReportUuid", COUNT(*) AS count
         FROM "Event" e
         JOIN "ScoutReport" sr  ON sr."uuid" = e."scoutReportUuid"
         JOIN "TeamMatchData" tmd ON tmd."key" = sr."teamMatchKey"
         JOIN "Scouter" sct    ON sct."uuid" = sr."scouterUuid"
         WHERE e."action" = 'INTAKE' AND e."position" = 'OUTPOST'
           ${t.clause} ${s.clause}
         GROUP BY e."scoutReportUuid"`,
        ...params,
      );

      if (raw.length === 0) return 0;
      return raw.reduce((acc, r) => acc + Number(r.count), 0) / raw.length;
    }

    // ------------------------------------------------------------------
    // timeFeeding
    // ------------------------------------------------------------------
    if (metric === Metric.timeFeeding) {
      const t = tnmtSql(`tmd."tournamentKey"`, 1);
      const s = teamSql(`sct."sourceTeamNumber"`, t.nextIdx);
      const params = buildParams(t.param, s.param);

      const raw = await prismaClient.$queryRawUnsafe<
        { scoutReportUuid: string; action: string; time: number }[]
      >(
        `SELECT e."scoutReportUuid", e."action", e."time"
         FROM "Event" e
         JOIN "ScoutReport" sr  ON sr."uuid" = e."scoutReportUuid"
         JOIN "TeamMatchData" tmd ON tmd."key" = sr."teamMatchKey"
         JOIN "Scouter" sct    ON sct."uuid" = sr."scouterUuid"
         WHERE e."action" IN ('START_FEEDING','STOP_FEEDING')
           ${t.clause} ${s.clause}`,
        ...params,
      );

      if (raw.length === 0) return 0;

      const byReport: Record<string, { action: string; time: number }[]> = {};
      for (const row of raw) {
        (byReport[row.scoutReportUuid] ??= []).push({
          action: row.action,
          time: row.time,
        });
      }

      const perReport = Object.values(byReport).map((events) => {
        const sorted = events.sort((a, b) => a.time - b.time);
        let total = 0;
        for (let i = 0; i < sorted.length; i += 2) {
          const s = sorted[i];
          const t = sorted[i + 1];
          if (s && t) {
            const dur = t.time - s.time;
            if (dur >= minActionDuration) total += dur;
          }
        }
        return total;
      });

      return perReport.reduce((a, b) => a + b, 0) / perReport.length;
    }

    // ------------------------------------------------------------------
    // defense times
    // ------------------------------------------------------------------
    if (
      metric === Metric.contactDefenseTime ||
      metric === Metric.campingDefenseTime ||
      metric === Metric.totalDefenseTime
    ) {
      const t = tnmtSql(`tmd."tournamentKey"`, 1);
      const s = teamSql(`sct."sourceTeamNumber"`, t.nextIdx);
      const params = buildParams(t.param, s.param);

      const raw = await prismaClient.$queryRawUnsafe<
        { scoutReportUuid: string; action: string; time: number }[]
      >(
        `SELECT e."scoutReportUuid", e."action", e."time"
         FROM "Event" e
         JOIN "ScoutReport" sr  ON sr."uuid" = e."scoutReportUuid"
         JOIN "TeamMatchData" tmd ON tmd."key" = sr."teamMatchKey"
         JOIN "Scouter" sct    ON sct."uuid" = sr."scouterUuid"
         WHERE e."action" IN ('START_DEFENDING','STOP_DEFENDING','START_CAMPING','STOP_CAMPING')
           ${t.clause} ${s.clause}`,
        ...params,
      );

      if (raw.length === 0) return 0;

      const byReport: Record<string, typeof raw> = {};
      for (const row of raw) (byReport[row.scoutReportUuid] ??= []).push(row);

      const calcDuration = (
        events: { action: string; time: number }[],
        start: string,
        stop: string,
      ) => {
        const evs = events
          .filter((e) => e.action === start || e.action === stop)
          .sort((a, b) => a.time - b.time);
        let total = 0;
        for (let i = 0; i < evs.length; i += 2) {
          const s = evs[i];
          const t = evs[i + 1];
          if (s && t) total += t.time - s.time;
        }
        return evs.length ? total : 0;
      };

      const reports = Object.values(byReport);
      const contactAvg =
        reports
          .map((r) => calcDuration(r, "START_DEFENDING", "STOP_DEFENDING"))
          .reduce((a, b) => a + b, 0) / reports.length;
      const campingAvg =
        reports
          .map((r) => calcDuration(r, "START_CAMPING", "STOP_CAMPING"))
          .reduce((a, b) => a + b, 0) / reports.length;

      if (metric === Metric.contactDefenseTime) return contactAvg;
      if (metric === Metric.campingDefenseTime) return campingAvg;
      return contactAvg + campingAvg;
    }

    // ------------------------------------------------------------------
    // autoClimbStartTime
    // ------------------------------------------------------------------
    if (metric === Metric.autoClimbStartTime) {
      const t = tnmtSql(`tmd."tournamentKey"`, 1);
      const s = teamSql(`sct."sourceTeamNumber"`, t.nextIdx);
      const params = buildParams(t.param, s.param);

      const raw = await prismaClient.$queryRawUnsafe<
        { scoutReportUuid: string; time: number }[]
      >(
        `SELECT e."scoutReportUuid", e."time"
         FROM "Event" e
         JOIN "ScoutReport" sr  ON sr."uuid" = e."scoutReportUuid"
         JOIN "TeamMatchData" tmd ON tmd."key" = sr."teamMatchKey"
         JOIN "Scouter" sct    ON sct."uuid" = sr."scouterUuid"
         WHERE e."action" = 'CLIMB'
           AND e."time" <= ${autoEnd}
           AND sr."autoClimb" = 'SUCCEEDED'
           ${t.clause} ${s.clause}`,
        ...params,
      );

      if (raw.length === 0) return 0;

      // Earliest CLIMB per report
      const byReport: Record<string, number> = {};
      for (const row of raw) {
        if (
          byReport[row.scoutReportUuid] === undefined ||
          row.time < byReport[row.scoutReportUuid]
        ) {
          byReport[row.scoutReportUuid] = row.time;
        }
      }
      const times = Object.values(byReport).map((t) => autoEnd - t);
      return times.reduce((a, b) => a + b, 0) / times.length;
    }

    // ------------------------------------------------------------------
    // l1/l2/l3 StartTime
    // ------------------------------------------------------------------
    if (
      metric === Metric.l1StartTime ||
      metric === Metric.l2StartTime ||
      metric === Metric.l3StartTime
    ) {
      const required =
        metric === Metric.l1StartTime
          ? "L1"
          : metric === Metric.l2StartTime
            ? "L2"
            : "L3";

      const t = tnmtSql(`tmd."tournamentKey"`, 1);
      const s = teamSql(`sct."sourceTeamNumber"`, t.nextIdx);
      const climbIdx = t.nextIdx + (s.param ? 1 : 0);
      const params = buildParams(t.param, s.param);

      const raw = await prismaClient.$queryRawUnsafe<
        { scoutReportUuid: string; time: number }[]
      >(
        `SELECT e."scoutReportUuid", e."time"
         FROM "Event" e
         JOIN "ScoutReport" sr  ON sr."uuid" = e."scoutReportUuid"
         JOIN "TeamMatchData" tmd ON tmd."key" = sr."teamMatchKey"
         JOIN "Scouter" sct    ON sct."uuid" = sr."scouterUuid"
         WHERE e."action" = 'CLIMB'
           AND e."time" > ${autoEnd}
           AND e."time" <= 158
           AND sr."endgameClimb" = $${climbIdx}
           ${t.clause} ${s.clause}`,
        ...params,
        required,
      );

      if (raw.length === 0) return 0;

      const byReport: Record<string, number> = {};
      for (const row of raw) {
        if (
          byReport[row.scoutReportUuid] === undefined ||
          row.time < byReport[row.scoutReportUuid]
        ) {
          byReport[row.scoutReportUuid] = row.time;
        }
      }
      const times = Object.values(byReport).map((t) => Math.max(0, 158 - t));
      return times.reduce((a, b) => a + b, 0) / times.length;
    }

    // ------------------------------------------------------------------
    // defenseEffectiveness
    // ------------------------------------------------------------------
    if (metric === Metric.defenseEffectiveness) {
      const t = tnmtSql(`tmd."tournamentKey"`, 1);
      const s = teamSql(`sct."sourceTeamNumber"`, t.nextIdx);
      const params = buildParams(t.param, s.param);

      const raw = await prismaClient.$queryRawUnsafe<{ avg: number | null }[]>(
        `SELECT AVG(sr."defenseEffectiveness") AS avg
         FROM "ScoutReport" sr
         JOIN "TeamMatchData" tmd ON tmd."key" = sr."teamMatchKey"
         JOIN "Scouter" sct    ON sct."uuid" = sr."scouterUuid"
         WHERE 1=1 ${t.clause} ${s.clause}`,
        ...params,
      );

      return raw[0]?.avg ?? 0;
    }

    // ------------------------------------------------------------------
    // teleopPoints / autoPoints / totalPoints
    // ------------------------------------------------------------------
    if (
      metric === Metric.teleopPoints ||
      metric === Metric.autoPoints ||
      metric === Metric.totalPoints
    ) {
      const timeFilter =
        metric === Metric.teleopPoints
          ? `AND e."time" > ${autoEnd}`
          : metric === Metric.autoPoints
            ? `AND e."time" <= ${autoEnd}`
            : "";

      const t = tnmtSql(`tmd."tournamentKey"`, 1);
      const s = teamSql(`sct."sourceTeamNumber"`, t.nextIdx);
      const params = buildParams(t.param, s.param);

      const raw = await prismaClient.$queryRawUnsafe<
        {
          tournamentKey: string;
          scoutReportUuid: string;
          matchPoints: bigint;
          endgameClimb: string | null;
          autoClimb: string | null;
        }[]
      >(
        `SELECT
           tmd."tournamentKey",
           sr."uuid" AS "scoutReportUuid",
           COALESCE(SUM(e."points"), 0) AS "matchPoints",
           ${
             metric === Metric.totalPoints
               ? `sr."endgameClimb", sr."autoClimb"`
               : `NULL AS "endgameClimb", NULL AS "autoClimb"`
           }
         FROM "TeamMatchData" tmd
         JOIN "ScoutReport" sr  ON sr."teamMatchKey" = tmd."key"
         LEFT JOIN "Event" e    ON e."scoutReportUuid" = sr."uuid"
                               AND e."action" = 'STOP_SCORING'
                               ${timeFilter}
         JOIN "Scouter" sct     ON sct."uuid" = sr."scouterUuid"
         WHERE 1=1 ${t.clause} ${s.clause}
         GROUP BY tmd."tournamentKey", sr."uuid", sr."endgameClimb", sr."autoClimb"`,
        ...params,
      );

      if (raw.length === 0) return 0;

      const perTournamentValues: Record<string, number[]> = {};
      for (const row of raw) {
        let points = Number(row.matchPoints);
        if (metric === Metric.totalPoints) {
          const endgame = row.endgameClimb as keyof typeof endgameToPoints;
          points += endgame ? (endgameToPoints[endgame] ?? 0) : 0;
          if (row.autoClimb === "SUCCEEDED") points += 15;
        }
        (perTournamentValues[row.tournamentKey] ??= []).push(points);
      }

      const perTournamentAverages = Object.values(perTournamentValues).map(
        (arr) => arr.reduce((a, b) => a + b, 0) / arr.length,
      );
      return perTournamentAverages.length
        ? weightedTourAvgLeft(perTournamentAverages)
        : 0;
    }

    // ------------------------------------------------------------------
    // All other metrics — event groupBy
    // ------------------------------------------------------------------
    const action = metricToEvent[metric];

    const t = tnmtSql(`tmd."tournamentKey"`, 1);
    const s = teamSql(`sct."sourceTeamNumber"`, t.nextIdx);
    const actionIdx = t.nextIdx + (s.param ? 1 : 0);
    const params = buildParams(t.param, s.param);

    const data = await prismaClient.$queryRawUnsafe<
      { scoutReportUuid: string; count: bigint }[]
    >(
      `SELECT e."scoutReportUuid", COUNT(*) AS count
       FROM "Event" e
       JOIN "ScoutReport" sr  ON sr."uuid" = e."scoutReportUuid"
       JOIN "TeamMatchData" tmd ON tmd."key" = sr."teamMatchKey"
       JOIN "Scouter" sct    ON sct."uuid" = sr."scouterUuid"
       WHERE e."action" = $${actionIdx}
         ${t.clause} ${s.clause}
       GROUP BY e."scoutReportUuid"`,
      ...params,
      action,
    );

    const avgCount = data.length
      ? data.reduce((acc, cur) => acc + Number(cur.count), 0) / data.length
      : 0;
    return avgCount || 0;
  },
} as const;

export async function averageAllTeamFast(user: any, args: { metric: Metric }) {
  return runAnalysis(config as any, user, args as any);
}
