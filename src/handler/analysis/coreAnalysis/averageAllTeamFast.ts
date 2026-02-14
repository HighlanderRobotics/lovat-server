import prismaClient from "../../../prismaClient.js";
import {
  accuracyToPercentageInterpolated,
  allTeamNumbers,
  autoEnd,
  defaultEndgamePoints,
  endgameToPoints,
  Metric,
  metricToEvent,
} from "../analysisConstants.js";
import { Prisma } from "@prisma/client";
import z from "zod";
import {
  dataSourceRuleToPrismaFilter,
  dataSourceRuleSchema,
} from "../dataSourceRule.js";
import { runAnalysis } from "../analysisFunction.js";
import { weightedTourAvgLeft } from "./arrayAndAverageTeams.js";

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

    const sourceTnmtFilter = dataSourceRuleToPrismaFilter<string>(
      dataSourceRuleSchema(z.string()).parse(ctx.user.tournamentSourceRule),
    );
    const sourceTeamFilter = dataSourceRuleToPrismaFilter<number>(
      dataSourceRuleSchema(z.number()).parse(ctx.user.teamSourceRule),
    );

    if (metric === Metric.driverAbility) {
      const data = await prismaClient.scoutReport.aggregate({
        _avg: { driverAbility: true },
        where: {
          teamMatchData: { tournamentKey: sourceTnmtFilter },
          scouter: { sourceTeamNumber: sourceTeamFilter },
        },
      });
      return data._avg.driverAbility ?? 0;
    }

    if (metric === Metric.accuracy) {
      const data = await prismaClient.scoutReport.aggregate({
        _avg: { accuracy: true },
        where: {
          teamMatchData: { tournamentKey: sourceTnmtFilter },
          scouter: { sourceTeamNumber: sourceTeamFilter },
        },
      });
      return accuracyToPercentageInterpolated(data._avg.accuracy ?? 0);
    }

    if (metric === Metric.fuelPerSecond) {
      // scoringRate: total STOP_SCORING quantity divided by SCORING duration per report, averaged across reports
      const reports = await prismaClient.scoutReport.findMany({
        where: {
          teamMatchData: { tournamentKey: sourceTnmtFilter },
          scouter: { sourceTeamNumber: sourceTeamFilter },
        },
        select: {
          events: { select: { action: true, quantity: true, time: true } },
        },
      });

      if (reports.length === 0) return 0;

      const perReportRates = reports.map((r) => {
        const totalFuel = r.events
          .filter((e) => e.action === "STOP_SCORING")
          .reduce((acc, cur) => acc + (cur.quantity ?? 0), 0);
        // Compute total SCORING duration via START_/STOP_ pairs
        const scoringEvents = r.events
          .filter(
            (e) => e.action === "START_SCORING" || e.action === "STOP_SCORING",
          )
          .sort((a, b) => a.time - b.time);
        let duration = 0;
        for (let i = 0; i < scoringEvents.length; i += 2) {
          const startEv = scoringEvents[i];
          const stopEv = scoringEvents[i + 1];
          if (startEv && stopEv) duration += stopEv.time - startEv.time;
        }
        return duration > 0 ? totalFuel / duration : 0;
      });

      const avgRate = perReportRates.reduce((a, b) => a + b, 0) / perReportRates.length;
      return avgRate;
    }

    if (metric === Metric.totalFuelOutputted) {
      // Per-tournament average, then weighted across tournaments
      const tmd = await prismaClient.teamMatchData.findMany({
        where: { tournamentKey: sourceTnmtFilter },
        select: {
          tournamentKey: true,
          scoutReports: {
            where: { scouter: { sourceTeamNumber: sourceTeamFilter } },
            select: { events: { select: { action: true, quantity: true } } },
          },
        },
      });
      if (tmd.length === 0) return 0;
       const perTournamentAvg: number[] = [];
       for (const row of tmd) {
         const totalsPerMatch = row.scoutReports.map((r) => {
           const scored = r.events
             .filter((e) => e.action === "STOP_SCORING")
             .reduce((acc, cur) => acc + (cur.quantity ?? 0), 0);
           const fed = r.events
             .filter((e) => e.action === "STOP_FEEDING")
             .reduce((acc, cur) => acc + (cur.quantity ?? 0), 0);
           return scored + fed;
         });
         if (totalsPerMatch.length > 0) {
           const avgMatch = totalsPerMatch.reduce((a, b) => a + b, 0) / totalsPerMatch.length;
           perTournamentAvg.push(avgMatch);
           if (process.env.ANALYSIS_DEBUG === "1") {
             console.log("[avgAllTeamFast] totalFuelOutputted", {
               tournamentKey: row.tournamentKey,
               perMatch: totalsPerMatch,
               tournamentValue: avgMatch,
             });
           }
         }
       }
       const weighted = perTournamentAvg.length ? weightedTourAvgLeft(perTournamentAvg) : 0;
       if (process.env.ANALYSIS_DEBUG === "1") {
         console.log("[avgAllTeamFast] totalFuelOutputted weighted", {
           perTournamentAvg,
           weighted,
         });
       }
       return weighted;
    }


    if (metric === Metric.totalBallThroughput) {
      // Per-tournament average, then weighted across tournaments
      const tmd = await prismaClient.teamMatchData.findMany({
        where: { tournamentKey: sourceTnmtFilter },
        select: {
          tournamentKey: true,
          scoutReports: {
            where: { scouter: { sourceTeamNumber: sourceTeamFilter } },
            select: { events: { select: { action: true, quantity: true } } },
          },
        },
      });
      if (tmd.length === 0) return 0;
      const perTournamentAvg: number[] = [];
      for (const row of tmd) {
        const totalsPerMatch = row.scoutReports.map((r) => {
          const total = r.events
            .filter(
              (e) => e.action === "STOP_SCORING" || e.action === "STOP_FEEDING",
            )
            .reduce((acc, cur) => acc + (cur.quantity ?? 0), 0);
          return total;
        });
        if (totalsPerMatch.length > 0) {
          const avgMatch = totalsPerMatch.reduce((a, b) => a + b, 0) / totalsPerMatch.length;
          perTournamentAvg.push(avgMatch);
        }
      }
      return perTournamentAvg.length ? weightedTourAvgLeft(perTournamentAvg) : 0;
    }

    if (metric === Metric.outpostIntakes) {
      const reports = await prismaClient.scoutReport.findMany({
        where: {
          teamMatchData: { tournamentKey: sourceTnmtFilter },
          scouter: { sourceTeamNumber: sourceTeamFilter },
        },
        select: {
          events: { select: { action: true, position: true } },
        },
      });
      if (reports.length === 0) return 0;
      const perReportCounts = reports.map((r) =>
        r.events.filter((e) => e.action === "INTAKE" && e.position === "OUTPOST").length,
      );
      return perReportCounts.reduce((a, b) => a + b, 0) / perReportCounts.length;
    }

    if (metric === Metric.timeFeeding) {
      const reports = await prismaClient.scoutReport.findMany({
        where: {
          teamMatchData: { tournamentKey: sourceTnmtFilter },
          scouter: { sourceTeamNumber: sourceTeamFilter },
        },
        select: { events: { select: { action: true, time: true } } },
      });
      if (reports.length === 0) return 0;
      const perReport = reports.map((r) => {
        const feedEvents = r.events
          .filter((e) => e.action === "START_FEEDING" || e.action === "STOP_FEEDING")
          .sort((a, b) => a.time - b.time);
        let total = 0;
        for (let i = 0; i < feedEvents.length; i += 2) {
          const s = feedEvents[i];
          const t = feedEvents[i + 1];
          if (s && t) total += t.time - s.time;
        }
        return feedEvents.length ? total : 0;
      });
      return perReport.reduce((a, b) => a + b, 0) / perReport.length;
    }

    if (
      metric === Metric.contactDefenseTime ||
      metric === Metric.campingDefenseTime ||
      metric === Metric.totalDefenseTime
    ) {
      const reports = await prismaClient.scoutReport.findMany({
        where: {
          teamMatchData: { tournamentKey: sourceTnmtFilter },
          scouter: { sourceTeamNumber: sourceTeamFilter },
        },
        select: { events: { select: { action: true, time: true } } },
      });
      if (reports.length === 0) return 0;
      const perReportContact = reports.map((r) => {
        const evs = r.events
          .filter((e) => e.action === "START_DEFENDING" || e.action === "STOP_DEFENDING")
          .sort((a, b) => a.time - b.time);
        let total = 0;
        for (let i = 0; i < evs.length; i += 2) {
          const s = evs[i];
          const t = evs[i + 1];
          if (s && t) total += t.time - s.time;
        }
        return evs.length ? total : 0;
      });
      const perReportCamping = reports.map((r) => {
        const evs = r.events
          .filter((e) => e.action === "START_CAMPING" || e.action === "STOP_CAMPING")
          .sort((a, b) => a.time - b.time);
        let total = 0;
        for (let i = 0; i < evs.length; i += 2) {
          const s = evs[i];
          const t = evs[i + 1];
          if (s && t) total += t.time - s.time;
        }
        return evs.length ? total : 0;
      });
      const contactAvg = perReportContact.reduce((a, b) => a + b, 0) / perReportContact.length;
      const campingAvg = perReportCamping.reduce((a, b) => a + b, 0) / perReportCamping.length;
      if (metric === Metric.contactDefenseTime) return contactAvg;
      if (metric === Metric.campingDefenseTime) return campingAvg;
      return contactAvg + campingAvg;
    }

    if (metric === Metric.autoClimbStartTime) {
      const reports = await prismaClient.scoutReport.findMany({
        where: {
          teamMatchData: { tournamentKey: sourceTnmtFilter },
          scouter: { sourceTeamNumber: sourceTeamFilter },
          autoClimb: "SUCCEEDED",
        },
        select: {
          events: { select: { action: true, time: true } },
        },
      });
      if (reports.length === 0) return 0;
      const times: number[] = [];
      reports.forEach((r) => {
        const first = r.events
          .filter((e) => e.action === "CLIMB" && (e.time ?? 0) <= autoEnd)
          .map((e) => e.time ?? 0)
          .sort((a, b) => a - b)[0];
        if (first !== undefined) times.push(first);
      });
      return times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0;
    }

    if (metric === Metric.l1StartTime || metric === Metric.l2StartTime || metric === Metric.l3StartTime) {
      const required =
        metric === Metric.l1StartTime ? "L1" : metric === Metric.l2StartTime ? "L2" : "L3";
      const reports = await prismaClient.scoutReport.findMany({
        where: {
          teamMatchData: { tournamentKey: sourceTnmtFilter },
          scouter: { sourceTeamNumber: sourceTeamFilter },
          endgameClimb: required as any,
        },
        select: {
          events: { select: { action: true, time: true } },
        },
      });
      if (reports.length === 0) return 0;
      const times: number[] = [];
      reports.forEach((r) => {
        const firstTeleop = r.events
          .filter((e) => e.action === "CLIMB" && (e.time ?? 0) > autoEnd)
          .map((e) => e.time ?? 0)
          .sort((a, b) => a - b)[0];
        if (firstTeleop !== undefined) times.push(firstTeleop);
      });
      return times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0;
    }

    if (metric === Metric.defenseEffectiveness) {
      const data = await prismaClient.scoutReport.aggregate({
        _avg: { defenseEffectiveness: true },
        where: {
          teamMatchData: { tournamentKey: sourceTnmtFilter },
          scouter: { sourceTeamNumber: sourceTeamFilter },
        },
      });
      return data._avg.defenseEffectiveness ?? 0;
    }

    if (
      metric === Metric.teleopPoints ||
      metric === Metric.autoPoints ||
      metric === Metric.totalPoints
    ) {
      let timeFilter: Prisma.IntFilter | undefined = undefined;
      if (metric === Metric.autoPoints) timeFilter = { lte: autoEnd } as any;
      else if (metric === Metric.teleopPoints) timeFilter = { gt: autoEnd } as any;

      const where: Prisma.EventWhereInput = {
        scoutReport: {
          teamMatchData: { tournamentKey: sourceTnmtFilter },
          scouter: { sourceTeamNumber: sourceTeamFilter },
        },
        action: "STOP_SCORING",
      };
      if (timeFilter) where.time = timeFilter as any;

      const data = await prismaClient.event.groupBy({
        by: "scoutReportUuid",
        _sum: { points: true },
        where,
      });

      if (data.length === 0) return 0;

      const avgMatchPoints =
        data.reduce((acc, cur) => acc + (cur._sum.points ?? 0), 0) / data.length;

      let avgEndgameAndAutoClimbPoints = 0;
      if (metric === Metric.totalPoints) {
        const endgameClimbs = await prismaClient.scoutReport.groupBy({
          by: "endgameClimb",
          _count: { _all: true },
          where: {
            teamMatchData: { tournamentKey: sourceTnmtFilter },
            scouter: { sourceTeamNumber: sourceTeamFilter },
          },
        });

        const totalEndgameReports = endgameClimbs.reduce(
          (acc, cur) => acc + cur._count._all,
          0,
        );
        if (totalEndgameReports > 0) {
          endgameClimbs.forEach((endgame) => {
            avgEndgameAndAutoClimbPoints +=
              endgameToPoints[endgame.endgameClimb] * endgame._count._all;
          });
          avgEndgameAndAutoClimbPoints /= totalEndgameReports;
        }

        const autoClimbSuccess = await prismaClient.scoutReport.count({
          where: {
            teamMatchData: { tournamentKey: sourceTnmtFilter },
            scouter: { sourceTeamNumber: sourceTeamFilter },
            autoClimb: "SUCCEEDED",
          },
        });
        const totalReports = await prismaClient.scoutReport.count({
          where: {
            teamMatchData: { tournamentKey: sourceTnmtFilter },
            scouter: { sourceTeamNumber: sourceTeamFilter },
          },
        });
        const avgAutoClimbPoints = totalReports > 0 ? (autoClimbSuccess * 15) / totalReports : 0;
        avgEndgameAndAutoClimbPoints += avgAutoClimbPoints;
      }

      return avgMatchPoints + avgEndgameAndAutoClimbPoints;
    }

    const action = metricToEvent[metric];

    const data = await prismaClient.event.groupBy({
      by: "scoutReportUuid",
      _count: { _all: true },
      where: {
        scoutReport: {
          teamMatchData: { tournamentKey: sourceTnmtFilter },
          scouter: { sourceTeamNumber: sourceTeamFilter },
        },
        action: action,
      },
    });

    const avgCount =
      data.reduce((acc, cur) => acc + cur._count._all, 0) / data.length;
    return avgCount || 0;
  },
} as const;

export async function averageAllTeamFast(user: any, args: { metric: Metric }) {
  return runAnalysis(config as any, user, args as any);
}
