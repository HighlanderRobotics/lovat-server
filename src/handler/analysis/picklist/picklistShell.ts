import { Response } from "express";
import prismaClient from "../../../prismaClient";
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
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

/**
 * Main picklist endpoint. Note inconsistent strings make it confusing for this season.
 * Normal metrics are send and received in the lettering suggested by the query inputs, but FLAGS are send and received as shown in metricToName.
 *
 * @returns picklist data as given by zScoreMany
 */
export const picklistShell = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    let flags = [];
    if (req.query.flags) {
      flags = JSON.parse(req.query.flags as string);
    }

    const params = z
      .object({
        tournamentKey: z.string().optional(),
        flags: z.array(z.string()),
        metrics: z.record(z.string(), z.number()),
      })
      .safeParse({
        tournamentKey: req.query.tournamentKey || undefined,
        flags: flags,
        metrics: {
          totalpoints:
            Number(req.query.totalpoints) || Number(req.body.totalpoints) || 0,
          autopoints:
            Number(req.query.autopoints) || Number(req.body.autopoints) || 0,
          teleoppoints:
            Number(req.query.teleoppoints) ||
            Number(req.body.teleoppoints) ||
            0,
          driverability:
            Number(req.query.driverability) ||
            Number(req.body.driverability) ||
            0,
          bargeresult:
            Number(req.query.bargeresult) || Number(req.body.bargeresult) || 0,
          totalCoral:
            Number(req.query.totalcoral) || Number(req.body.totalcoral) || 0,
          level1: Number(req.query.level1) || Number(req.body.level1) || 0,
          level2: Number(req.query.level2) || Number(req.body.level2) || 0,
          level3: Number(req.query.level3) || Number(req.body.level3) || 0,
          level4: Number(req.query.level4) || Number(req.body.level4) || 0,
          coralpickup:
            Number(req.query.coralpickup) || Number(req.body.coralpickup) || 0,
          algaeProcessor:
            Number(req.query.algaeProcessor) ||
            Number(req.body.algaeProcessor) ||
            0,
          algaeNet:
            Number(req.query.algaeNet) || Number(req.body.algaeNet) || 0,
          algaePickups:
            Number(req.query.algaePickups) ||
            Number(req.body.algaePickups) ||
            0,
          feeds: Number(req.query.feeds) || Number(req.body.feeds) || 0,
          defends: Number(req.query.defends) || Number(req.body.defends) || 0,
        },
      });
    if (!params.success) {
      res.status(400).send(params);
      return;
    }

    // Stopgap to error out 2024 picklists
    if (req.query.stage) {
      res.status(400).send({ error: "OUTDATED_PICKLIST" });
      return;
    }

    // No data without a tournament key (should make this an impossible request from the frontend)
    if (!params.data.tournamentKey) {
      res.status(200).send([]);
      return;
    }

    //check for all metrics being 0, if so error
    const allMetricsZero = Object.values(params.data.metrics).every(
      (v) => v === 0,
    );
    if (allMetricsZero) {
      res.status(400).send("All weights are zero");
      return;
    }

    //if tournament matches not in yet, attempt to add them
    const matches = await prismaClient.teamMatchData.findFirst({
      where: {
        tournamentKey: params.data.tournamentKey,
      },
    });
    if (!matches) {
      await addTournamentMatches(params.data.tournamentKey);
    }

    // Teams to look at
    const teamsAtTournament = await prismaClient.teamMatchData.groupBy({
      by: ["teamNumber"],
      where: {
        tournamentKey: params.data.tournamentKey,
      },
    });
    const includedTeams = teamsAtTournament.map((team) => team.teamNumber);
    if (includedTeams.length === 0) {
      throw "Bad event, not enough teams";
    }

    // Metrics to aggregate
    const includedMetrics = new Set<Metric>();
    for (const picklistParam in picklistToMetric) {
      if (params.data.metrics[picklistParam]) {
        includedMetrics.add(picklistToMetric[picklistParam]);
      }
    }
    for (const metric of metricsCategory) {
      if (params.data.flags.includes(metricToName[metric])) {
        includedMetrics.add(metric);
      }
    }

    const allTeamData = await averageManyFast(
      includedTeams,
      [...includedMetrics],
      req.user,
    );

    const dataArr = await zScoreMany(
      allTeamData,
      includedTeams,
      params.data.tournamentKey,
      params.data.metrics,
      params.data.flags,
    );

    const resultArr = dataArr.sort((a, b) => b.result - a.result);
    res.status(200).send({ teams: resultArr });
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
};
