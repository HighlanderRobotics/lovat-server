import prismaClient from "../../../prismaClient.js";
import {
  accuracyToPercentageInterpolated,
  autoEnd,
  defaultEndgamePoints,
  endgameToPoints,
  Metric,
  metricToEvent,
} from "../analysisConstants.js";
import { Position, Prisma } from "@prisma/client";
import z from "zod";
import {
  dataSourceRuleToPrismaFilter,
  dataSourceRuleSchema,
} from "../dataSourceRule.js";
import { runAnalysis } from "../analysisFunction.js";

const config = {
  argsSchema: z.object({ metric: z.nativeEnum(Metric) }),
  usesDataSource: true,
  shouldCache: true,
  createKey: (args: { metric: Metric }) => {
    const metric = args.metric;
    return {
      key: ["averageAllTeamFast", String(metric)],
      teamDependencies: [],
      tournamentDependencies: [],
    };
  },
  calculateAnalysis: async (
    args: { metric: Metric },
    ctx: { user: { teamSourceRule: unknown; tournamentSourceRule: unknown } },
  ) => {
    const metric = args.metric;
    if (metric === Metric.l1StartTime) {
      //fix later
      return defaultEndgamePoints;
    }

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
      return data._avg.driverAbility;
    }

    if (metric === Metric.accuracy) {
      const data = await prismaClient.scoutReport.aggregate({
        _avg: { accuracy: true },
        where: {
          teamMatchData: { tournamentKey: sourceTnmtFilter },
          scouter: { sourceTeamNumber: sourceTeamFilter },
        },
      });
      return accuracyToPercentageInterpolated(data._avg.accuracy);
    }

    if (metric === Metric.fuelPerSecond) {
      const data = await prismaClient.scoutReport.aggregate({
        _avg: { accuracy: true },
        where: {
          teamMatchData: { tournamentKey: sourceTnmtFilter },
          scouter: { sourceTeamNumber: sourceTeamFilter },
        },
      });
      return data._avg.accuracy;
    }

    if (metric === Metric.defenseEffectiveness) {
      const data = await prismaClient.scoutReport.aggregate({
        _avg: { defenseEffectiveness: true },
        where: {
          teamMatchData: { tournamentKey: sourceTnmtFilter },
          scouter: { sourceTeamNumber: sourceTeamFilter },
        },
      });
      return data._avg.defenseEffectiveness;
    }

    if (
      metric === Metric.teleopPoints ||
      metric === Metric.autoPoints ||
      metric === Metric.totalPoints
    ) {
      let timeFilter: Prisma.IntFilter = undefined;
      if (metric === Metric.autoPoints) timeFilter = { lte: autoEnd };
      else if (metric === Metric.teleopPoints) timeFilter = { gt: autoEnd };

      const data = await prismaClient.event.groupBy({
        by: "scoutReportUuid",
        _sum: { points: true },
        where: {
          scoutReport: {
            teamMatchData: { tournamentKey: sourceTnmtFilter },
            scouter: { sourceTeamNumber: sourceTeamFilter },
          },
          time: timeFilter,
        },
      });

      if (data.length === 0) return 0;

      const avgMatchPoints =
        data.reduce((acc, cur) => acc + cur._sum.points, 0) / data.length;

      let avgEndgamePoints = 0;
      if (metric === Metric.totalPoints) {
        const endgameClimbs = await prismaClient.scoutReport.groupBy({
          by: "endgameClimb",
          _count: { _all: true },
          where: {
            teamMatchData: { tournamentKey: sourceTnmtFilter },
            scouter: { sourceTeamNumber: sourceTeamFilter },
          },
        });

        endgameClimbs.forEach((endgame) => {
          avgEndgamePoints +=
            endgameToPoints[endgame.endgameClimb] * endgame._count._all;
        });
        avgEndgamePoints /= endgameClimbs.reduce(
          (acc, cur) => acc + cur._count._all,
          0,
        );
      }

      return avgMatchPoints + avgEndgamePoints;
    }

    const action = metricToEvent[metric];
    let position: Position = undefined;

    const data = await prismaClient.event.groupBy({
      by: "scoutReportUuid",
      _count: { _all: true },
      where: {
        scoutReport: {
          teamMatchData: { tournamentKey: sourceTnmtFilter },
          scouter: { sourceTeamNumber: sourceTeamFilter },
        },
        action: action,
        position: position,
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
