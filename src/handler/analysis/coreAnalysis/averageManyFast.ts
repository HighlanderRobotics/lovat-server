import prismaClient from "../../../prismaClient.js";
import {
  autoEnd,
  endgameToPoints,
  Metric,
  metricToEvent,
  minActionDuration,
  swrConstant,
  ttlConstant,
  allTournaments,
  accuracyToPercentage,
} from "../analysisConstants.js";
import { EndgameClimb, AutoClimb, Prisma, Event, $Enums } from "@prisma/client";
import { weightedTourAvgLeft } from "./arrayAndAverageTeams.js";
import z from "zod";
import {
  dataSourceRuleToPrismaFilter,
  dataSourceRuleSchema,
} from "../dataSourceRule.js";
import { runAnalysis, AnalysisFunctionConfig } from "../analysisFunction.js";
import { User } from "@prisma/client";

export interface ArrayFilter<T> {
  notIn?: T[];
  in?: T[];
}
/* ----------------------- helpers ----------------------- */
export function avg(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

function avgNonNull(values: (number | null)[]): number {
  const v = values.filter((x): x is number => x !== null);
  return avg(v);
}

function firstEventTime(
  events: Event[],
  predicate: (e: Event) => boolean,
): number | null {
  const evt = events.filter(predicate).sort((a, b) => a.time - b.time)[0];
  if (!evt) return null;
  return evt.time;
}
/* ------------------------------------------------------- */

const argsSchema = z.object({
  teams: z.array(z.number()),
  metrics: z.array(z.nativeEnum(Metric)),
});

const config: AnalysisFunctionConfig<typeof argsSchema, z.ZodType> = {
  argsSchema,
  returnSchema: z.record(z.string(), z.record(z.string(), z.number())),
  usesDataSource: true,
  shouldCache: true,

  createKey: (args) => ({
    key: [
      "averageManyFast",
      JSON.stringify(args.teams.sort((a, b) => a - b)),
      JSON.stringify(args.metrics.map(String).sort()),
    ],
    teamDependencies: args.teams,
    tournamentDependencies: [],
  }),

  calculateAnalysis: async (args, ctx) => {
    const tnmtFilter = dataSourceRuleToPrismaFilter<string>(
      dataSourceRuleSchema(z.string()).parse(ctx.user.tournamentSourceRule),
    );

    const teamFilter = dataSourceRuleToPrismaFilter<number>(
      dataSourceRuleSchema(z.number()).parse(ctx.user.teamSourceRule),
    );

    const tmdWhere: Prisma.TeamMatchDataWhereInput = {
      teamNumber: { in: args.teams },
      ...(tnmtFilter && { tournamentKey: tnmtFilter }),
    };

    const srWhere: Prisma.ScoutReportWhereInput = teamFilter
      ? { scouter: { sourceTeamNumber: teamFilter } }
      : {};

    const tmd = await prismaClient.teamMatchData.findMany({
      cacheStrategy: { swr: swrConstant, ttl: ttlConstant },
      where: tmdWhere,
      select: {
        teamNumber: true,
        tournamentKey: true,
        scoutReports: {
          where: srWhere,
          select: {
            events: true,
            driverAbility: true,
            endgameClimb: true,
            autoClimb: true,
            accuracy: true,
            defenseEffectiveness: true,
          },
        },
      },
    });

    const tournamentIndex = await allTournaments;
    const finalResults: Record<string, Record<string, number>> = {};

    for (const metric of args.metrics) {
      // Group by team -> tournament -> match values
      const resultsByTeamAndTournament: Record<number, Record<string, number[]>> = {};
      for (const team of args.teams) resultsByTeamAndTournament[team] = {};

      for (const row of tmd) {
        if (!row.scoutReports.length) continue;

        const team = row.teamNumber;
        const tnmt = row.tournamentKey;
        const sr = row.scoutReports;

        if (!resultsByTeamAndTournament[team][tnmt]) {
          resultsByTeamAndTournament[team][tnmt] = [];
        }

        let matchValue = 0;

        switch (metric) {
          case Metric.autoClimbStartTime: {
            const times = sr.map((r) => {
              if (r.autoClimb !== AutoClimb.SUCCEEDED) return null;
              return firstEventTime(
                r.events,
                (e) => e.action === "CLIMB" && e.time <= autoEnd,
              );
            });
            const nonNullTimes = times.filter((t): t is number => t !== null);
            if (nonNullTimes.length === 0) { matchValue = -1; break; }
            const adjustedTimes = nonNullTimes.map((t) => {
              const remaining = autoEnd - t;
              return remaining >= 0 ? remaining : 0;
            });
            matchValue = avg(adjustedTimes.length ? adjustedTimes : [0]);
            break;
          }

          case Metric.l1StartTime:
          case Metric.l2StartTime:
          case Metric.l3StartTime: {
            const required =
              metric === Metric.l1StartTime
                ? EndgameClimb.L1
                : metric === Metric.l2StartTime
                  ? EndgameClimb.L2
                  : EndgameClimb.L3;

            const times = sr.map((r) => {
              if (r.endgameClimb !== required) return null;
              return firstEventTime(
                r.events,
                (e) => e.action === "CLIMB" && e.time > autoEnd && e.time <= 158,
              );
            });

            const nonNullTimes = times.filter((t): t is number => t !== null);
            if (nonNullTimes.length === 0) { matchValue = -1; break; }
            const adjustedTimes = nonNullTimes.map((t) => {
              const remaining = 158 - t;
              return remaining >= 0 ? remaining : 0;
            });
            matchValue = avg(adjustedTimes.length ? adjustedTimes : [0]);
            break;
          }
          case Metric.contactDefenseTime:
          case Metric.campingDefenseTime:
          case Metric.totalDefenseTime: {
            const contact = avg(calculateTimeMetric(sr, "DEFENDING"));
            const camping = avg(calculateTimeMetric(sr, "CAMPING"));
            if (metric === Metric.contactDefenseTime) matchValue = contact;
            else if (metric === Metric.campingDefenseTime) matchValue = camping;
            else matchValue = contact + camping;
            break;
          }

          /* ---------- SCORED METRICS ---------- */
          case Metric.driverAbility:
            matchValue = avg(sr.map((r) => r.driverAbility));
            break;
          case Metric.defenseEffectiveness:
            matchValue = avg(sr.map((r) => r.defenseEffectiveness));
            break;
          case Metric.accuracy:
            {
              const defined = sr.filter((r) => r.accuracy !== null && r.accuracy !== undefined);
              matchValue = defined.length
                ? avg(defined.map((r) => accuracyToPercentage[r.accuracy as any]))
                : 0;
            }
            break;
          case Metric.autoPoints:
          case Metric.teleopPoints:
          case Metric.totalPoints: {
            const perReport = sr.map((r) => {
              const auto = r.events
                .filter((e) => e.time <= autoEnd && e.action === "STOP_SCORING")
                .reduce((a, b) => a + b.points, 0);
              const tele = r.events
                .filter((e) => e.time > autoEnd && e.action === "STOP_SCORING")
                .reduce((a, b) => a + b.points, 0);
              const aClimb = r.autoClimb === AutoClimb.SUCCEEDED ? 15 : 0;
              const endgame = endgameToPoints[r.endgameClimb];
              if (metric === Metric.autoPoints) return auto;
              if (metric === Metric.teleopPoints) return tele;
              return aClimb + auto + tele + endgame;
            });
            matchValue = avg(perReport);
            break;
          }
          case Metric.fuelPerSecond: {
            // Total fuel across all reports / total duration across all reports
            const totalFuel = sr
              .flatMap((r) => r.events)
              .filter((e) => e.action === "STOP_SCORING")
              .reduce((acc, cur) => acc + (cur.quantity ?? 0), 0);
            const totalDuration = calculateTimeMetric(sr, "SCORING").reduce(
              (a, b) => a + b,
              0,
            );
            matchValue = totalDuration > 0 ? totalFuel / totalDuration : 0;
            break;
          }
          case Metric.totalFuelOutputted: {
            const perReport = sr.map((r) => {
              const shotQty = r.events
                .filter((e) => e.action === "STOP_SCORING")
                .reduce((acc, cur) => acc + (cur.quantity ?? 0), 0);
              const feedQty = r.events
                .filter((e) => e.action === "STOP_FEEDING")
                .reduce((acc, cur) => acc + (cur.quantity ?? 0), 0);
              return shotQty + feedQty;
            });
            matchValue = avg(perReport);
            break;
          }
          case Metric.totalBallsFed: {
            const perReport = sr.map((r) => {
              return r.events
                .filter((e) => e.action === "STOP_FEEDING")
                .reduce((acc, cur) => acc + (cur.quantity ?? 0), 0);
            });
            matchValue = avg(perReport);
            break;
          }
          case Metric.totalBallThroughput: {
            const perReport = sr.map((r) => {
              return r.events
                .filter(
                  (e) =>
                    e.action === "STOP_FEEDING" || e.action === "STOP_SCORING",
                )
                .reduce((acc, cur) => acc + (cur.quantity ?? 0), 0);
            });
            matchValue = avg(perReport);
            break;
          }
          case Metric.feedsPerMatch: {
            const perReport = sr.map(
              (r) => r.events.filter((e) => e.action === "STOP_FEEDING").length,
            );
            matchValue = avg(perReport);
            break;
          }
          case Metric.feedingRate: {
            const feedTime = calculateTimeMetric(sr, "FEEDING");
            const feeds = sr.flatMap((r) =>
              r.events.filter((e) => e.action === "STOP_FEEDING"),
            );
            const totalFeedQuantity = feeds.reduce(
              (acc, f) => acc + (f.quantity ?? 0),
              0,
            );
            matchValue =
              totalFeedQuantity > 0 ? totalFeedQuantity / avg(feedTime) : 0;
            break;
          }
          case Metric.timeFeeding: {
            matchValue = avg(calculateTimeMetric(sr, "FEEDING"));
            break;
          }

          case Metric.outpostIntakes: {
            const perReport = sr.map(
              (r) =>
                r.events.filter(
                  (e) => e.action === "INTAKE" && e.position === "OUTPOST",
                ).length,
            );
            matchValue = avg(perReport);
            break;
          }
          default: {
            const perReport = sr.map(
              (r) =>
                r.events.filter((e) => e.action === metricToEvent[metric])
                  .length,
            );
            matchValue = avg(perReport);
          }
        }

        resultsByTeamAndTournament[team][tnmt].push(matchValue);
      }

      finalResults[String(metric)] = {};
      for (const team of args.teams) {
        // First average within each tournament, then apply weighted average across tournaments
        const tournamentAverages: number[] = [];
        for (const values of Object.values(resultsByTeamAndTournament[team])) {
          const valid = values.filter((v) => v !== -1);
          if (valid.length > 0) tournamentAverages.push(avg(valid));
        }
        finalResults[String(metric)][String(team)] =
          tournamentAverages.length > 0 ? weightedTourAvgLeft(tournamentAverages) : -1;
      }
    }

    return finalResults;
  },
};

export const averageManyFast = async (
  user: User,
  args: z.infer<typeof argsSchema>,
) => runAnalysis(config, user, args);

export function calculateTimeMetric(
  sr: {
    events?: {
      eventUuid: string;
      time: number;
      action: $Enums.EventAction;
      position: $Enums.Position;
      points: number;
      scoutReportUuid: string;
    }[];
  }[],
  event: string,
): number[] {
  const perMatch = sr.map((r) => {
    const feedingEvents = r.events.filter(
      (e) => e.action === `STOP_${event}` || e.action === `START_${event}`,
    );
    const feedingEventsSorted = feedingEvents.sort((a, b) => a.time - b.time);
    let totalTime = 0;
    for (let i = 0; i < feedingEventsSorted.length; i += 2) {
      const startEvent = feedingEventsSorted[i];
      const endEvent = feedingEventsSorted[i + 1];
      if (startEvent && endEvent) {
        const duration = endEvent.time - startEvent.time;
        if (duration >= minActionDuration) {
          totalTime += duration;
        }
      }
    }
    return feedingEvents.length > 0 ? totalTime : 0;
  });
  return perMatch;
}
