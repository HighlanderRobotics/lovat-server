import { Request, Response } from "express";
import prismaClient from "../../prismaClient.js";
import z from "zod";
import { TeamMatchData, ScoutReport } from "@prisma/client";
import { computeAverageScoutReport } from "../analysis/coreAnalysis/averageScoutReport.js";
import { Metric } from "../analysis/analysisConstants.js";

export const getMatchResults = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const params = z
      .object({
        matchKey: z.string(),
      })
      .parse(req.query);

    const teams = [];

    for (let i = 0; i < 6; i++) {
      teams[i] = await prismaClient.teamMatchData.findUnique({
        where: {
          key: `${params.matchKey}_${i}`,
        },
        include: {
          scoutReports: true,
        },
      });
    }

    const out: MatchResultsOutput = {
      red: await getAllianceResults(teams.slice(0, 3)),
      blue: await getAllianceResults(teams.slice(3, 6)),
    };

    res.status(200).send(out);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};

export const ALLIANCE_METRICS: Metric[] = [
  Metric.totalPoints,
  Metric.totalDefenseTime,
  Metric.totalFuelOutputted,
  Metric.autoPoints,
  Metric.teleopPoints,
];

interface MatchResultsOutput {
  red: AllianceResultsOutput;
  blue: AllianceResultsOutput;
}

interface AllianceResultsOutput {
  teams: TeamOutput[];
  totalPoints: number;
  totalDefenseTime: number;
  totalFuelOutputted: number;
  autoPoints: number;
  teleopPoints: number;
}

interface TeamOutput {
  teamNumber: number;
  pointsScored: number;
  reports: ScoutReport[];
  role: number[];
}

async function getAllianceResults(
  matchData: (TeamMatchData & { scoutReports: ScoutReport[] })[],
) {
  const totals = Object.fromEntries(
    ALLIANCE_METRICS.map((metric) => [metric, 0]),
  );

  for (let i = 0; i < 3; i++) {
    const teamTotals = Object.fromEntries(
      ALLIANCE_METRICS.map((metric) => [metric, 0]),
    );

    for (const report of matchData[i].scoutReports) {
      const result = await computeAverageScoutReport(
        report.uuid,
        ALLIANCE_METRICS,
      );
      for (const stat of ALLIANCE_METRICS) {
        teamTotals[stat] += result[stat];
      }
    }

    for (const stat of ALLIANCE_METRICS) {
      totals[stat] +=
        teamTotals[stat] / (matchData[i].scoutReports.length || 1);
    }
  }

  const out: AllianceResultsOutput = {
    teams: [
      await getTeamResults(matchData[0]),
      await getTeamResults(matchData[1]),
      await getTeamResults(matchData[2]),
    ],
    totalPoints: totals[Metric.totalPoints],
    totalDefenseTime: totals[Metric.totalDefenseTime],
    totalFuelOutputted: totals[Metric.totalFuelOutputted],
    autoPoints: totals[Metric.autoPoints],
    teleopPoints: totals[Metric.teleopPoints],
  };

  return out;
}

async function getTeamResults(
  matchData: TeamMatchData & { scoutReports: ScoutReport[] },
) {
  let total = 0;

  for (const report of matchData.scoutReports) {
    const result = await computeAverageScoutReport(report.uuid, [
      Metric.totalPoints,
    ]);
    total += result[Metric.totalPoints];
  }

  const out: TeamOutput = {
    teamNumber: matchData.teamNumber,
    pointsScored: total / (matchData.scoutReports.length || 1),
    role: getRobotRole(matchData.scoutReports),
    reports: matchData.scoutReports,
  };

  return out;
}

function getRobotRole(reports: ScoutReport[]) {
  const out: number[] = [0, 0, 0, 0, 0, 0];

  for (const report of reports) {
    if (report.robotRole === "CYCLING") {
      out[0]++;
    }
    if (report.robotRole === "SCORING") {
      out[1]++;
    }
    if (report.robotRole === "FEEDING") {
      out[2]++;
    }
    if (report.robotRole === "DEFENDING") {
      out[3]++;
    }
    if (report.robotRole === "IMMOBILE") {
      out[4]++;
    }
  }

  return out;
}
