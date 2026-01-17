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
      totalpoints: z.coerce.number().optional(),
      autopoints: z.coerce.number().optional(),
      teleoppoints: z.coerce.number().optional(),
      driverability: z.coerce.number().optional(),
      accuracy: z.coerce.number().optional(),
      climbresult: z.coerce.number().optional(),
      fuelscored: z.coerce.number().optional(),
      depotintakes: z.coerce.number().optional(),
      groundintakes: z.coerce.number().optional(),
      outpostintakes: z.coerce.number().optional(),
      outpostouttakes: z.coerce.number().optional(),
    }),
  },
  usesDataSource: true,
  shouldCache: true,
  createKey: ({ query }) => {
    const metricsKey = {
      totalpoints: query.totalpoints || 0,
      autopoints: query.autopoints || 0,
      teleoppoints: query.teleoppoints || 0,
      driverability: query.driverability || 0,
      accuracy: query.driverability || 0,
      climbresult: query.climbresult || 0,
      fuelscored: query.fuelscored || 0,
      depotintakes: query.depotintakes || 0,
      groundintakes: query.groundintakes || 0,
      outpostintakes: query.outpostintakes || 0,
      outpostouttakes: query.outpostouttakes || 0,
    };

    return {
      key: [
        "picklistShell",
        query.tournamentKey || "",
        JSON.stringify(query.flags || []),
        JSON.stringify(metricsKey),
      ],
      teamDependencies: [],
      tournamentDependencies: [query.tournamentKey],
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
      accuracy: query.driverability || 0,
      climbresult: query.climbresult || 0,
      fuelscored: query.fuelscored || 0,
      depotintakes: query.depotintakes || 0,
      groundintakes: query.groundintakes || 0,
      outpostintakes: query.outpostintakes || 0,
      outpostouttakes: query.outpostouttakes || 0,
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
