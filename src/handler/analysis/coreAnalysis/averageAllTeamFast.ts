import prismaClient from "../../../prismaClient";
import { autoEnd, defaultEndgamePoints, endgameToPoints, Metric, metricToEvent } from "../analysisConstants";
import { Position, Prisma } from "@prisma/client";
import z from "zod";
import { dataSourceRuleToPrismaQuery, dataSourceRuleSchema } from "../dataSourceRule";
import { createAnalysisFunction } from "../analysisFunction";

export const averageAllTeamFast = createAnalysisFunction({
  argsSchema: [z.nativeEnum(Metric)],
  usesDataSource: true,
  shouldCache: true,
  createKey: ({ args }) => {
    const [metric] = args;
    return {
      key: ["averageAllTeamFast", String(metric)],
      teamDependencies: [],
      tournamentDependencies: [],
    };
  },
  calculateAnalysis: async ({ args }, ctx) => {
    const [metric] = args;
    // Early return for barge points default
    if (metric === Metric.bargePoints) {
      return defaultEndgamePoints;
    }

    const sourceTnmtFilter = dataSourceRuleToPrismaQuery<string>(
      dataSourceRuleSchema(z.string()).parse(ctx.user.tournamentSourceRule),
    );
    const sourceTeamFilter = dataSourceRuleToPrismaQuery<number>(
      dataSourceRuleSchema(z.number()).parse(ctx.user.teamSourceRule),
    );

    // Driver ability average
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

    // Point totals (teleop / auto / total)
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

      const avgMatchPoints = data.reduce((acc, cur) => acc + cur._sum.points, 0) / data.length;

      let avgEndgamePoints = 0;
      if (metric === Metric.totalPoints) {
        const bargeResults = await prismaClient.scoutReport.groupBy({
          by: "bargeResult",
          _count: { _all: true },
          where: {
            teamMatchData: { tournamentKey: sourceTnmtFilter },
            scouter: { sourceTeamNumber: sourceTeamFilter },
          },
        });

        bargeResults.forEach((endgame) => {
          avgEndgamePoints += endgameToPoints[endgame.bargeResult] * endgame._count._all;
        });
        avgEndgamePoints /= bargeResults.reduce((acc, cur) => acc + cur._count._all, 0) || 1;
      }

      return avgMatchPoints + avgEndgamePoints;
    }

    // Generic event count metrics
    const action = metricToEvent[metric];
    let position: Position = undefined;
    switch (metric) {
      case Metric.coralL1: position = Position.LEVEL_ONE; break;
      case Metric.coralL2: position = Position.LEVEL_TWO; break;
      case Metric.coralL3: position = Position.LEVEL_THREE; break;
      case Metric.coralL4: position = Position.LEVEL_FOUR; break;
    }

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

    const avgCount = data.reduce((acc, cur) => acc + cur._count._all, 0) / data.length;
    return avgCount || 0;
  },
});
