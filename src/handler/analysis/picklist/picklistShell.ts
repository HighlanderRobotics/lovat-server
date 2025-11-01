import prismaClient from "../../../prismaClient";
import z from "zod";
import { addTournamentMatches } from "../../manager/addTournamentMatches";
import {
  Metric,
  metricsCategory,
  metricToName,
  picklistToMetric,
} from "../analysisConstants";
import { averageManyFast } from "../coreAnalysis/averageManyFast";
import { zScoreMany } from "./zScoreMany";
import { createAnalysisHandler } from "../analysisHandler";

/**
 * Main picklist endpoint. Note inconsistent strings make it confusing for this season.
 * Normal metrics are send and received in lettering suggested by query inputs, but FLAGS are send and received as shown in metricToName.
 *
 * @returns picklist data as given by zScoreMany
 */
export const picklistShell = createAnalysisHandler({
  params: {
    query: z.object({
      tournamentKey: z.string().optional(),
      flags: z.string().transform((val) => {
        try {
          return JSON.parse(val) || [];
        } catch {
          return [];
        }
      }).optional(),
      stage: z.string().optional(),
      totalpoints: z.coerce.number().optional(),
      autopoints: z.coerce.number().optional(),
      teleoppoints: z.coerce.number().optional(),
      driverability: z.coerce.number().optional(),
      bargeresult: z.coerce.number().optional(),
      totalcoral: z.coerce.number().optional(),
      level1: z.coerce.number().optional(),
      level2: z.coerce.number().optional(),
      level3: z.coerce.number().optional(),
      level4: z.coerce.number().optional(),
      coralpickup: z.coerce.number().optional(),
      algaeProcessor: z.coerce.number().optional(),
      algaeNet: z.coerce.number().optional(),
      algaePickups: z.coerce.number().optional(),
      feeds: z.coerce.number().optional(),
      defends: z.coerce.number().optional(),
    }),
  },
  usesDataSource: true,
  createKey: ({ query }) => {
    const metricsKey = {
      totalpoints: query.totalpoints || 0,
      autopoints: query.autopoints || 0,
      teleoppoints: query.teleoppoints || 0,
      driverability: query.driverability || 0,
      bargeresult: query.bargeresult || 0,
      totalcoral: query.totalcoral || 0,
      level1: query.level1 || 0,
      level2: query.level2 || 0,
      level3: query.level3 || 0,
      level4: query.level4 || 0,
      coralpickup: query.coralpickup || 0,
      algaeProcessor: query.algaeProcessor || 0,
      algaeNet: query.algaeNet || 0,
      algaePickups: query.algaePickups || 0,
      feeds: query.feeds || 0,
      defends: query.defends || 0,
    };
    
    return {
      key: ["picklistShell", query.tournamentKey || "", JSON.stringify(query.flags || []), JSON.stringify(metricsKey)],
      teamDependencies: [],
    };
  },
  calculateAnalysis: async ({ query }, ctx) => {
    // Stopgap to error out 2024 picklists
    if (query.stage) {
      throw new Error("OUTDATED_PICKLIST");
    }

    // No data without a tournament key (should make this an impossible request from frontend)
    if (!query.tournamentKey) {
      return [];
    }

    const metrics = {
      totalpoints: query.totalpoints || 0,
      autopoints: query.autopoints || 0,
      teleoppoints: query.teleoppoints || 0,
      driverability: query.driverability || 0,
      bargeresult: query.bargeresult || 0,
      totalCoral: query.totalcoral || 0,
      level1: query.level1 || 0,
      level2: query.level2 || 0,
      level3: query.level3 || 0,
      level4: query.level4 || 0,
      coralpickup: query.coralpickup || 0,
      algaeProcessor: query.algaeProcessor || 0,
      algaeNet: query.algaeNet || 0,
      algaePickups: query.algaePickups || 0,
      feeds: query.feeds || 0,
      defends: query.defends || 0,
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

    const allTeamData = await averageManyFast(
      includedTeams,
      [...includedMetrics],
      ctx.user,
    );

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
