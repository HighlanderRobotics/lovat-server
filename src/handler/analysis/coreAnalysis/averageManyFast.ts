import prismaClient from "../../../prismaClient.js";
import {
  autoEnd,
  endgameToPoints,
  Metric,
  metricToEvent,
  swrConstant,
  ttlConstant,
  allTournaments,
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
import { ca } from "zod/locales";

export interface ArrayFilter<T> {
  notIn?: T[];
  in?: T[];
}
/* ----------------------- helpers ----------------------- */
function avg(values: number[]): number {
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
  return evt ? evt.time : null;
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
      const resultsByTeam: Record<number, number[]> = {};
      for (const team of args.teams) resultsByTeam[team] = [];

      for (const row of tmd) {
        if (!row.scoutReports.length) continue;

        const team = row.teamNumber;
        const sr = row.scoutReports;

        let tournamentValue = 0;

        switch (metric) {
          /* ---------- CLIMB METRICS ---------- */
          case Metric.autoClimbStartTime: {
            const times = sr.map((r) => {
              if (r.autoClimb !== AutoClimb.SUCCEEDED) return null;
              return firstEventTime(r.events, (e) => e.action === "CLIMB");
            });
            tournamentValue = avgNonNull(times);
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
                (e) => e.action === "CLIMB" && e.time > autoEnd,
              );
            });

            tournamentValue = avgNonNull(times);
            break;
          }

          /* ---------- DEFENSE METRICS ---------- */
          case Metric.contactDefenseTime:
          case Metric.campingDefenseTime:
          case Metric.totalDefenseTime: {
            const perMatch = sr.map((r) => {
              const contact = (tournamentValue = avg(
                calculateTimeMetric(sr, "DEFENDING"),
              ));
              const camping = (tournamentValue = avg(
                calculateTimeMetric(sr, "CAMPING"),
              ));
              if (metric === Metric.contactDefenseTime) return contact;
              if (metric === Metric.campingDefenseTime) return camping;
              return contact + camping;
            });
            tournamentValue = avg(perMatch);
            break;
          }

          /* ---------- SCORED METRICS ---------- */
          case Metric.driverAbility:
            tournamentValue = avg(sr.map((r) => r.driverAbility));
            break;
          case Metric.defenseEffectiveness:
            tournamentValue = avg(sr.map((r) => r.defenseEffectiveness));
            break;
          case Metric.accuracy:
            tournamentValue = avg(sr.map((r) => r.accuracy));
            break;

          /* ---------- POINT METRICS ---------- */
          case Metric.autoPoints:
          case Metric.teleopPoints:
          case Metric.totalPoints: {
            const perMatch = sr.map((r) => {
              const auto = r.events
                .filter((e) => e.time <= autoEnd && e.action === "STOP_SCORING")
                .reduce((a, b) => a + b.points, 0);
              const tele = r.events
                .filter((e) => e.time > autoEnd && e.action === "STOP_SCORING")
                .reduce((a, b) => a + b.points, 0);
              const aClimb = avg(
                sr.map((s) => (s.autoClimb !== AutoClimb.SUCCEEDED ? 0 : 15)),
              );
              const endgame = avg(
                sr.map((s) => endgameToPoints[s.endgameClimb]),
              );
              if (metric === Metric.autoPoints) return auto;
              if (metric === Metric.teleopPoints) return tele;
              return aClimb + auto + tele + endgame;
            });
            tournamentValue = avg(perMatch);
            break;
          }

          /* ---------- FUEL/FEEDING METRICS ---------- */
          case Metric.fuelPerSecond: {
            const perMatch = sr.map((r) => {
              const totalFuel = r.events
                .filter((e) => e.action === "STOP_SCORING")
                .reduce((acc, cur) => acc + cur.points, 0);
              const firstStopTime = firstEventTime(
                r.events,
                (e) => e.action === "STOP_SCORING",
              );
              const duration = firstStopTime
                ? firstStopTime - (r.events[0]?.time ?? 0)
                : 150; // assume full match if no stop event
              return duration > 0 ? totalFuel / duration : 0;
            });
            tournamentValue = avg(perMatch);
            break;
          }
          case Metric.totalFuelOutputted: {
            const perMatch = sr.map((r) => {
              return r.events
                .filter((e) => e.action === "STOP_SCORING")
                .reduce((acc, cur) => acc + cur.points, 0);
            });
            tournamentValue = avg(perMatch);
            break;
          }
          case Metric.feedsPerMatch: {
            const perMatch = sr.map(
              (r) => r.events.filter((e) => e.action === "STOP_FEEDING").length,
            );
            tournamentValue = avg(perMatch);
            break;
          }
          case Metric.feedingRate: {
            const feedTime = calculateTimeMetric(sr, "STOP_FEEDING");
            const feeds = sr.flatMap((r) =>
              r.events.filter((e) => e.action === "STOP_FEEDING"),
            );
            const totalFeedPoints = feeds.reduce((acc, f) => acc + f.points, 0);
            tournamentValue =
              totalFeedPoints > 0 ? totalFeedPoints / avg(feedTime) : 0;
            break;
          }
          case Metric.timeFeeding: {
            tournamentValue = avg(calculateTimeMetric(sr, "STOP_FEEDING"));
            break;
          }

          /* ---------- OTHER COUNT / RATE METRICS ---------- */
          case Metric.outpostIntakes: {
            const perMatch = sr.map(
              (r) =>
                r.events.filter(
                  (e) => e.action === "INTAKE" && e.position === "OUTPOST",
                ).length,
            );
            tournamentValue = avg(perMatch);
            break;
          }
          default: {
            const perMatch = sr.map(
              (r) =>
                r.events.filter((e) => e.action === metricToEvent[metric])
                  .length,
            );
            tournamentValue = avg(perMatch);
          }
        }

        resultsByTeam[team].push(tournamentValue);
      }

      finalResults[String(metric)] = {};
      for (const team of args.teams) {
        finalResults[String(metric)][String(team)] = weightedTourAvgLeft(
          resultsByTeam[team],
        );
      }
    }

    return finalResults;
  },
};

export const averageManyFast = async (
  user: User,
  args: z.infer<typeof argsSchema>,
) => runAnalysis(config, user, args);

function calculateTimeMetric(
  sr: {
    events: {
      eventUuid: string;
      time: number;
      action: $Enums.EventAction;
      position: $Enums.Position;
      points: number;
      scoutReportUuid: string;
    }[];
    driverAbility: number;
    endgameClimb: $Enums.EndgameClimb;
    autoClimb: $Enums.AutoClimb;
    accuracy: number;
    defenseEffectiveness: number;
  }[],
  arg1: string,
): number[] {
  const perMatch = sr.map((r) => {
    const feedingEvents = r.events.filter(
      (e) => e.action === "STOP_FEEDING" || e.action === "START_FEEDING",
    );
    const feedingEventsSorted = feedingEvents.sort((a, b) => a.time - b.time);
    let totalTime = 0;
    for (let i = 0; i < feedingEventsSorted.length; i += 2) {
      const startEvent = feedingEventsSorted[i];
      const endEvent = feedingEventsSorted[i + 1];
      if (startEvent && endEvent) {
        totalTime += endEvent.time - startEvent.time;
      }
    }
    return feedingEvents.length > 0 ? totalTime : 0;
  });
  return perMatch;
}
