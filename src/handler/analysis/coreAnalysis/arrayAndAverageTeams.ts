import prismaClient from "../../../prismaClient.js";
import {
  accuracyToPercentage,
  autoEnd,
  endgameToPoints,
  Metric,
  metricToEvent,
  swrConstant,
  ttlConstant,
} from "../analysisConstants.js";
import { endgamePicklistTeamFast } from "../picklist/endgamePicklistTeamFast.js";
import { Event, Prisma, ScoutReport, $Enums } from "@prisma/client";
import {
  dataSourceRuleSchema,
  dataSourceRuleToPrismaFilter,
} from "../dataSourceRule.js";
import z from "zod";
import { runAnalysis, AnalysisFunctionConfig } from "../analysisFunction.js";
import {
  averageManyFast,
  avg,
  calculateTimeMetric,
} from "./averageManyFast.js";

// Accurately aggregate an analog metric on multiple teams at once (weighs matches equally regardless of extra scout reports).
// Provides a timeline of metric value per match.
// Optimized to compare one metric over a few teams.

const argsSchema = z.object({
  teams: z.array(z.number()),
  metric: z.nativeEnum(Metric),
});

const returnSchema = z.record(
  z.string(),
  z.object({
    average: z.number(),
    timeLine: z
      .array(
        z.object({
          match: z.string(),
          dataPoint: z.number(),
          tournamentName: z.string(),
        }),
      )
      .nullable(),
  }),
);

const config: AnalysisFunctionConfig<typeof argsSchema, typeof returnSchema> = {
  argsSchema,
  returnSchema,
  usesDataSource: true,
  shouldCache: true,
  createKey: async (args) => {
    const { teams, metric } = args;
    return {
      key: [
        "arrayAndAverageTeams",
        JSON.stringify([...teams].sort((a, b) => a - b)),
        String(metric),
      ],
      teamDependencies: teams,
      tournamentDependencies: [],
    };
  },
  calculateAnalysis: async (
    args: z.infer<typeof argsSchema>,
    ctx: { user: import("@prisma/client").User },
  ) => {
    const { teams, metric } = args;
    try {
      const sourceTnmtFilter = dataSourceRuleToPrismaFilter<string>(
        dataSourceRuleSchema(z.string()).parse(ctx.user.tournamentSourceRule),
      );
      const sourceTeamFilter = dataSourceRuleToPrismaFilter<number>(
        dataSourceRuleSchema(z.number()).parse(ctx.user.teamSourceRule),
      );

      // Data and aggregation based on metric. Variables determine data requested and aggregation method
      let srSelect: Prisma.ScoutReportSelect | null = null;
      let matchAggregationFunction:
        | ((reports: Partial<ScoutReport & { events: Event[] }>[]) => number)
        | null = null;

      switch (metric) {
        case Metric.driverAbility:
          srSelect = { driverAbility: true };
          matchAggregationFunction = (reports) => {
            return (
              reports.reduce((acc, cur) => acc + (cur.driverAbility ?? 0), 0) /
              (reports.length || 1)
            );
          };
          break;
        case Metric.accuracy:
          srSelect = { accuracy: true };
          matchAggregationFunction = (reports) => {
            const defined = reports.filter(
              (r) => r.accuracy !== null && r.accuracy !== undefined,
            );
            if (defined.length === 0) return 0;
            const total = defined.reduce(
              (acc, cur) => acc + accuracyToPercentage[cur.accuracy as any],
              0,
            );
            return total / defined.length;
          };
          break;

        case Metric.defenseEffectiveness:
          srSelect = { defenseEffectiveness: true };
          matchAggregationFunction = (reports) => {
            return (
              reports.reduce(
                (acc, cur) => acc + (cur.defenseEffectiveness ?? 0),
                0,
              ) / (reports.length || 1)
            );
          };
          break;

        case Metric.totalPoints:
          srSelect = {
            events: {
              where: { action: "STOP_SCORING" },
              select: { points: true, time: true },
            },
            endgameClimb: true,
            autoClimb: true,
          };
          matchAggregationFunction = (reports) => {
            let total = 0;
            reports.forEach((sr) => {
              const events = sr.events ?? [];
              events.forEach((e) => {
                total += e.points ?? 0;
              });
              // Include auto climb points (15) when succeeded
              const autoClimb = (sr as any).autoClimb as
                | "SUCCEEDED"
                | "FAILED"
                | "N_A"
                | undefined;
              if (autoClimb === "SUCCEEDED") {
                total += 15;
              }
              const endgame = sr.endgameClimb as keyof typeof endgameToPoints;
              total += endgame ? (endgameToPoints[endgame] ?? 0) : 0;
            });
            return total / (reports.length || 1);
          };
          break;

        case Metric.teleopPoints:
          srSelect = {
            events: {
              where: { time: { gt: autoEnd }, action: "STOP_SCORING" },
              select: { points: true },
            },
            endgameClimb: true,
          };
          matchAggregationFunction = (reports) => {
            let total = 0;
            reports.forEach((sr) => {
              const events = sr.events ?? [];
              events.forEach((e) => {
                total += e.points ?? 0;
              });
            });
            return total / (reports.length || 1);
          };
          break;

        case Metric.autoPoints:
          srSelect = {
            events: {
              where: { time: { lte: autoEnd }, action: "STOP_SCORING" },
              select: { points: true },
            },
          };
          matchAggregationFunction = (reports) => {
            let total = 0;
            reports.forEach((sr) => {
              const events = sr.events ?? [];
              events.forEach((e) => {
                total += e.points ?? 0;
              });
            });
            return total / (reports.length || 1);
          };
          break;
        case Metric.fuelPerSecond:
          srSelect = {
            events: {
              select: { action: true, quantity: true, time: true },
            },
          };
          matchAggregationFunction = (reports) => {
            // Average per-report scoring rate, then average per match
            const perReportRates = reports.map((r) => {
              const totalFuel = (r.events ?? [])
                .filter((e) => e.action === "STOP_SCORING")
                .reduce((acc, cur) => acc + (cur.quantity ?? 0), 0);
              const durations = calculateTimeMetric([r] as any, "SCORING");
              const duration = durations.reduce((a, b) => a + b, 0);
              return duration > 0 ? totalFuel / duration : 0;
            });
            return avg(perReportRates);
          };
          break;
        case Metric.feedingRate:
          srSelect = {
            events: {
              select: { action: true, quantity: true, time: true },
            },
          };
          matchAggregationFunction = (reports) => {
            const feedTime = calculateTimeMetric(reports as any, "FEEDING");
            const feeds = reports.flatMap((r) =>
              (r.events || []).filter((e) => e.action === "STOP_FEEDING"),
            );
            const totalFeedQuantity = feeds.reduce(
              (acc, f) => acc + (f.quantity ?? 0),
              0,
            );
            const avgFeedTime = avg(feedTime);
            return totalFeedQuantity > 0 && avgFeedTime > 0
              ? totalFeedQuantity / avgFeedTime
              : 0;
          };
          break;
        case Metric.timeFeeding:
          srSelect = {
            events: { select: { action: true, time: true } },
          } as any;
          matchAggregationFunction = (reports) => {
            const perMatch = calculateTimeMetric(reports as any, "FEEDING");
            return avg(perMatch);
          };
          break;
        case Metric.contactDefenseTime:
        case Metric.campingDefenseTime:
        case Metric.totalDefenseTime:
          srSelect = {
            events: { select: { action: true, time: true } },
          } as any;
          matchAggregationFunction = (reports) => {
            const contact = avg(
              calculateTimeMetric(reports as any, "DEFENDING"),
            );
            const camping = avg(calculateTimeMetric(reports as any, "CAMPING"));
            if (metric === Metric.contactDefenseTime) return contact;
            if (metric === Metric.campingDefenseTime) return camping;
            return contact + camping;
          };
          break;

        case Metric.totalFuelOutputted:
          srSelect = {
            events: {
              select: { action: true, quantity: true },
            },
          } as any;
          matchAggregationFunction = (reports) => {
            // Average per-report: STOP_SCORING.quantity + STOP_FEEDING.quantity
            const perReportTotals = reports.map((r) => {
              const events = r.events ?? [];
              const scored = events
                .filter((e) => e.action === "STOP_SCORING")
                .reduce((acc, cur) => acc + (cur.quantity ?? 0), 0);
              const fed = events
                .filter((e) => e.action === "STOP_FEEDING")
                .reduce((acc, cur) => acc + (cur.quantity ?? 0), 0);
              return scored + fed;
            });
            return avg(perReportTotals);
          };
          break;

        case Metric.totalBallThroughput:
          srSelect = {
            events: {
              select: { action: true, quantity: true },
            },
          } as any;
          matchAggregationFunction = (reports) => {
            // Sum STOP_SCORING + STOP_FEEDING quantities per report
            const perReportTotals = reports.map((r) => {
              const events = r.events ?? [];
              const total = events
                .filter(
                  (e) =>
                    e.action === "STOP_SCORING" || e.action === "STOP_FEEDING",
                )
                .reduce((acc, cur) => acc + (cur.quantity ?? 0), 0);
              return total;
            });
            return avg(perReportTotals);
          };
          break;

        case Metric.outpostIntakes:
          srSelect = {
            events: {
              select: { action: true, position: true },
            },
          } as any;
          matchAggregationFunction = (reports) => {
            const perReportCounts = reports.map(
              (r) =>
                (r.events ?? []).filter(
                  (e) => e.action === "INTAKE" && e.position === "OUTPOST",
                ).length,
            );
            return avg(perReportCounts);
          };
          break;

        case Metric.autoClimbStartTime:
          srSelect = {
            events: {
              select: { action: true, time: true },
            },
            autoClimb: true,
          } as any;
          matchAggregationFunction = (reports) => {
            // Average first CLIMB time in auto for SUCCEEDED auto climbs
            const times: number[] = [];
            reports.forEach((r) => {
              const ac = (r as any).autoClimb as
                | "SUCCEEDED"
                | "FAILED"
                | "N_A"
                | undefined;
              if (ac === "SUCCEEDED") {
                const first = (r.events ?? [])
                  .filter(
                    (e) => e.action === "CLIMB" && (e.time ?? 0) <= autoEnd,
                  )
                  .map((e) => e.time ?? 0)
                  .sort((a, b) => a - b)[0];
                if (first !== undefined) times.push(first);
              }
            });
            return times.length ? avg(times) : 0;
          };
          break;

        case Metric.l1StartTime:
        case Metric.l2StartTime:
        case Metric.l3StartTime:
          srSelect = {
            events: { select: { action: true, time: true } },
            endgameClimb: true,
          } as any;
          matchAggregationFunction = (reports) => {
            const times: number[] = [];
            const required =
              metric === Metric.l1StartTime
                ? "L1"
                : metric === Metric.l2StartTime
                  ? "L2"
                  : "L3";
            reports.forEach((r) => {
              const eg = (r as any).endgameClimb as
                | "NOT_ATTEMPTED"
                | "FAILED"
                | "L1"
                | "L2"
                | "L3"
                | undefined;
              if (eg === required) {
                const firstTeleop = (r.events ?? [])
                  .filter(
                    (e) => e.action === "CLIMB" && (e.time ?? 0) > autoEnd,
                  )
                  .map((e) => e.time ?? 0)
                  .sort((a, b) => a - b)[0];
                if (firstTeleop !== undefined) times.push(firstTeleop);
              }
            });
            return times.length ? avg(times) : 0;
          };
          break;

        default:
          // Generic event count
          const action = metricToEvent[metric];
          // Only filter by action; avoid undefined position filter
          srSelect = {
            events: {
              where: {
                action: action,
              },
              select: { eventUuid: true },
            },
          };

          matchAggregationFunction = (reports) => {
            let total = 0;
            reports.forEach((sr) => {
              total += (sr.events ?? []).length;
            });
            return total / (reports.length || 1);
          };
          break;
      }

      // Finish setting up filters to decrease server load
      const tmdFilter: Prisma.TeamMatchDataWhereInput = {};
      // Team filter
      tmdFilter.teamNumber = { in: teams };

      if (sourceTnmtFilter) {
        // Assign helper output directly; it's Prisma-compatible
        tmdFilter.tournamentKey = sourceTnmtFilter;
      }
      const srFilter: Prisma.ScoutReportWhereInput = {};
      if (sourceTeamFilter) {
        srFilter.scouter = {
          sourceTeamNumber: sourceTeamFilter,
        };
      }

      // Main query
      const tmd = await prismaClient.teamMatchData.findMany({
        cacheStrategy: {
          swr: swrConstant,
          ttl: ttlConstant,
        },
        where: tmdFilter,
        select: {
          tournamentKey: true,
          // There's gotta be some way to not have to send the tournamnet name through every time
          tournament: {
            select: {
              name: true,
            },
          },
          key: true,
          teamNumber: true,
          scoutReports: {
            where: srFilter,
            select: srSelect ?? {},
          },
        },
        orderBy: [
          // Ordered by oldest first
          {
            tournament: {
              date: "asc",
            },
          },
          { teamNumber: "asc" },
          { matchType: "asc" },
          { matchNumber: "asc" },
        ],
      });

      // Build per-team timelines and accumulate per-tournament values
      const perTeamTournamentValues: Record<
        number,
        Record<string, number[]>
      > = {};
      const result: Record<
        number,
        {
          average: number;
          timeLine: {
            match: string;
            dataPoint: number;
            tournamentName: string;
          }[];
        }
      > = {};

      for (const team of teams) {
        perTeamTournamentValues[team] = {};
        result[team] = { average: 0, timeLine: [] };
      }

      for (const row of tmd) {
        const team = row.teamNumber;
        const tnmt = row.tournamentKey;
        if (!perTeamTournamentValues[team][tnmt])
          perTeamTournamentValues[team][tnmt] = [];
        if (!row.scoutReports.length) continue;

        let matchValue = 0;
        if (metric === Metric.fuelPerSecond) {
          // Mirror averageManyFast: use total SCORING duration across all reports
          const totalDuration = calculateTimeMetric(
            row.scoutReports as any,
            "SCORING",
          ).reduce((a, b) => a + b, 0);
          const perReportRates = (row.scoutReports as any).map((r: any) => {
            const totalFuel = (r.events ?? [])
              .filter((e: any) => e.action === "STOP_SCORING")
              .reduce((acc: number, cur: any) => acc + (cur.quantity ?? 0), 0);
            return totalDuration > 0 ? totalFuel / totalDuration : 0;
          });
          matchValue = avg(perReportRates);
        } else {
          matchValue = matchAggregationFunction!(row.scoutReports as any);
        }

        // Push timeline entry
        result[team].timeLine.push({
          match: row.key,
          dataPoint: matchValue,
          tournamentName: row.tournament.name,
        });
        // Accumulate per tournament
        perTeamTournamentValues[team][tnmt].push(matchValue);
      }

      // Compute weighted averages per team across tournaments
      for (const team of teams) {
        const tournamentAverages: number[] = [];
        for (const values of Object.values(perTeamTournamentValues[team])) {
          if (values.length > 0) tournamentAverages.push(avg(values));
        }
        result[team].average = weightedTourAvgLeft(tournamentAverages);
      }

      return result;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
};

export const arrayAndAverageTeams = async (
  user: import("@prisma/client").User,
  args: z.infer<typeof argsSchema>,
) => runAnalysis(config, user, args);

// Most recent is last
export function weightedTourAvgLeft(values: number[]): number {
  let result = 0;

  for (let i = 0; i < values.length; i++) {
    if (i === 0) {
      // Initialize with furthest tournament
      result = values[0];
      // } else if (i === 0) {
      //     // Dynamic weighting for most recent tournament
      //     const weightOnRecent = 0.95 * (1 - (1 / (multiplerBaseAnalysis * (scoutedAtMostRecent/totalAtMostRecent) + 1)));
      //     result = result * (1 - weightOnRecent) + values[i] * weightOnRecent;
    } else {
      // Use default weights
      result = result * 0.2 + values[i] * 0.8;
    }
  }

  return result;
}
