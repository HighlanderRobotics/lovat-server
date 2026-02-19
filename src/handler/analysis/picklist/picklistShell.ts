import prismaClient from "../../../prismaClient.js";
import z from "zod";
import { addTournamentMatches } from "../../manager/addTournamentMatches.js";
import {
  Metric,
  metricsCategory,
  metricToName,
  picklistToMetric,
} from "../analysisConstants.js";
import { averageManyFast } from "../coreAnalysis/averageManyFast.js";
import { zScoreMany } from "./zScoreMany.js";
import { createAnalysisHandler } from "../analysisHandler.js";
/**
 * Main picklist endpoint. Note inconsistent strings make it confusing for this season.
 * Normal metrics are sent and received in lettering suggested by query inputs, but FLAGS are sent and received as shown in metricToName.
 *
 * @returns picklist data as given by zScoreMany
 */
export const picklistShell = createAnalysisHandler({
  params: {
    query: z.object({
      tournamentKey: z.string().optional(),
      flags: z
        .string()
        .transform((val) => {
          try {
            return JSON.parse(val) || [];
          } catch {
            return [];
          }
        })
        .optional(),
      stage: z.string().optional(),
      totalPoints: z.coerce.number().optional(),
      autoPoints: z.coerce.number().optional(),
      teleopPoints: z.coerce.number().optional(),
      driverAbility: z.coerce.number().optional(),
      climbResult: z.coerce.number().optional(),
      autoClimb: z.coerce.number().optional(),
      defenseEffectiveness: z.coerce.number().optional(),
      contactDefenseTime: z.coerce.number().optional(),
      campingDefenseTime: z.coerce.number().optional(),
      totalDefensiveTime: z.coerce.number().optional(),
      totalFuelThroughput: z.coerce.number().optional(),
      totalFuelFed: z.coerce.number().optional(),
      feedingRate: z.coerce.number().optional(),
      scoringRate: z.coerce.number().optional(),
      estimatedSuccessfulFuelRate: z.coerce.number().optional(),
      estimatedTotalFuelScored: z.coerce.number().optional(),
    }),
  },
  usesDataSource: true,
  shouldCache: true,
  createKey: async ({ query }) => {
    const metricsKey = {
      totalPoints: query.totalPoints || 0,
      autoPoints: query.autoPoints || 0,
      teleopPoints: query.teleopPoints || 0,
      driverAbility: query.driverAbility || 0,
      climbResult: query.climbResult || 0,
      autoClimb: query.autoClimb || 0,
      defenseEffectiveness: query.defenseEffectiveness || 0,
      contactDefenseTime: query.contactDefenseTime || 0,
      campingDefenseTime: query.campingDefenseTime || 0,
      totalDefensiveTime: query.totalDefensiveTime || 0,
      totalFuelThroughput: query.totalFuelThroughput || 0,
      totalFuelFed: query.totalFuelFed || 0,
      feedingRate: query.feedingRate || 0,
      scoringRate: query.scoringRate || 0,
      estimatedSuccessfulFuelRate: query.estimatedSuccessfulFuelRate || 0,
      estimatedTotalFuelScored: query.estimatedTotalFuelScored || 0,
    };

    return {
      key: [
        "picklistShell",
        query.tournamentKey || "",
        JSON.stringify(query.flags || []),
        JSON.stringify(metricsKey),
      ],
      teamDependencies: [],
      tournamentDependencies: query.tournamentKey ? [query.tournamentKey] : [],
    };
  },
  calculateAnalysis: async ({ query }, ctx) => {
    // Accept legacy 'stage' param but ignore it

    // No data without a tournament key (should make this an impossible request from frontend)
    if (!query.tournamentKey) {
      return { teams: [] };
    }

    const metrics = {
      totalPoints: query.totalPoints || 0,
      autoPoints: query.autoPoints || 0,
      teleopPoints: query.teleopPoints || 0,
      driverAbility: query.driverAbility || 0,
      climbResult: query.climbResult || 0,
      autoClimb: query.autoClimb || 0,
      defenseEffectiveness: query.defenseEffectiveness || 0,
      contactDefenseTime: query.contactDefenseTime || 0,
      campingDefenseTime: query.campingDefenseTime || 0,
      totalDefensiveTime: query.totalDefensiveTime || 0,
      totalFuelThroughput: query.totalFuelThroughput || 0,
      totalFuelFed: query.totalFuelFed || 0,
      feedingRate: query.feedingRate || 0,
      scoringRate: query.scoringRate || 0,
      estimatedSuccessfulFuelRate: query.estimatedSuccessfulFuelRate || 0,
      estimatedTotalFuelScored: query.estimatedTotalFuelScored || 0,
    };

    //check for all metrics being 0, if so error
    const allMetricsZero = Object.values(metrics).every((v) => v === 0);
    if (allMetricsZero) {
      throw new Error("All weights are zero");
    }

    //if tournament matches not in yet, attempt to add them
    const matches = await prismaClient.teamMatchData.findFirst({
      where: {
        tournamentKey: query.tournamentKey,
      },
    });
    if (!matches) {
      await addTournamentMatches(query.tournamentKey);
    }

    // Teams to look at
    const teamsAtTournament = await prismaClient.teamMatchData.groupBy({
      by: ["teamNumber"],
      where: {
        tournamentKey: query.tournamentKey,
      },
    });
    const includedTeams = teamsAtTournament.map((team) => team.teamNumber);
    if (includedTeams.length === 0) {
      throw "Bad event, not enough teams";
    }

    // Metrics to aggregate
    const includedMetrics = new Set<Metric>();
    for (const picklistParam in picklistToMetric) {
      if (metrics[picklistParam]) {
        includedMetrics.add(picklistToMetric[picklistParam]);
      }
    }
    for (const metric of metricsCategory) {
      if ((query.flags || []).includes(metricToName[metric])) {
        includedMetrics.add(metric);
      }
    }

    const allTeamData = await averageManyFast(ctx.user, {
      teams: includedTeams,
      metrics: [...includedMetrics],
    });

    const dataArr = await zScoreMany(
      allTeamData,
      includedTeams,
      query.tournamentKey,
      metrics,
      query.flags || [],
    );

    const resultArr = dataArr.sort((a, b) => b.result - a.result);
    return { teams: resultArr };
  },
});
