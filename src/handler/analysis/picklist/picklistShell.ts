import prismaClient from "../../../prismaClient.js";
import z from "zod";
import { CustomFieldType } from "@prisma/client";
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
import { applyCustomZScores } from "./applyCustomZScores.js";
import { customFieldNumberManyFast } from "../customFields/customFieldNumberAverages.js";
import {
  getActiveCustomFields,
  parseCfKey,
} from "../customFields/customFieldShared.js";

// Defensive parse of the customWeights JSON-object query param: anything that
// is not a finite, non-zero number keyed by a cf_ metric key is dropped.
const parseCustomWeights = (val: string): Record<string, number> => {
  try {
    const parsed = JSON.parse(val);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return {};
    }
    const weights: Record<string, number> = {};
    for (const [key, weight] of Object.entries(parsed)) {
      if (parseCfKey(key) === null) continue;
      if (typeof weight !== "number" || !Number.isFinite(weight)) continue;
      if (weight === 0) continue;
      weights[key] = weight;
    }
    return weights;
  } catch {
    return {};
  }
};
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
      customWeights: z.string().transform(parseCustomWeights).optional(),
    }),
  },
  usesDataSource: true,
  shouldCache: true,
  createKey: async ({ query }, ctx) => {
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

    const key = [
      "picklistShell",
      query.tournamentKey || "",
      JSON.stringify(query.flags || []),
      JSON.stringify(metricsKey),
    ];
    const teamDependencies: number[] = [];

    // Custom weights are viewer-scoped: fragment the key by weights + viewer
    // team and depend on the viewer team ONLY when custom weights are present
    // (zero key change otherwise), so config mutations invalidate the row.
    const customWeights = query.customWeights ?? {};
    const sortedCustomKeys = Object.keys(customWeights).sort();
    if (sortedCustomKeys.length > 0) {
      const sortedWeights: Record<string, number> = {};
      for (const weightKey of sortedCustomKeys) {
        sortedWeights[weightKey] = customWeights[weightKey];
      }
      key.push(JSON.stringify(sortedWeights));
      key.push(`viewer${ctx.user.teamNumber ?? "none"}`);
      if (ctx.user.teamNumber !== null && ctx.user.teamNumber !== undefined) {
        teamDependencies.push(ctx.user.teamNumber);
      }
    }

    return {
      key: key,
      teamDependencies: teamDependencies,
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

    // Validate custom weights: only the viewer's own active NUMBER fields
    // count; stale/foreign/archived uuids are silently dropped.
    const customWeights = query.customWeights ?? {};
    const validCustomWeights: Record<string, number> = {};
    if (
      Object.keys(customWeights).length > 0 &&
      ctx.user.teamNumber !== null &&
      ctx.user.teamNumber !== undefined
    ) {
      const ownedFields = await getActiveCustomFields(ctx.user.teamNumber, [
        CustomFieldType.NUMBER,
      ]);
      const ownedUuids = new Set(ownedFields.map((field) => field.uuid));
      for (const [weightKey, weight] of Object.entries(customWeights)) {
        const fieldUuid = parseCfKey(weightKey);
        if (fieldUuid !== null && ownedUuids.has(fieldUuid)) {
          validCustomWeights[fieldUuid] = weight;
        }
      }
    }

    //check for all metrics being 0, if so error
    const allMetricsZero = Object.values(metrics).every((v) => v === 0);
    if (allMetricsZero && Object.keys(validCustomWeights).length === 0) {
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

    // Fold weighted custom NUMBER fields into breakdowns/totals BEFORE the
    // final sort (viewer-scoped; cache key carries the viewer team fragment
    // whenever custom weights are present)
    if (
      Object.keys(validCustomWeights).length > 0 &&
      ctx.user.teamNumber !== null &&
      ctx.user.teamNumber !== undefined
    ) {
      const customAverages = await customFieldNumberManyFast(ctx.user, {
        viewerTeam: ctx.user.teamNumber,
        teams: includedTeams,
        fieldUuids: Object.keys(validCustomWeights),
      });
      applyCustomZScores(
        dataArr,
        includedTeams,
        customAverages,
        validCustomWeights,
      );
    }

    const resultArr = dataArr.sort((a, b) => b.result - a.result);
    return { teams: resultArr };
  },
});
