import { Request, Response } from "express";
import prismaClient from "../../prismaClient";
import z from "zod";
import { TeamMatchData, ScoutReport } from "@prisma/client";
import { computeAverageScoutReport } from "../analysis/coreAnalysis/averageScoutReport";
import { Metric } from "../analysis/analysisConstants";

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
  Metric.coralL1,
  Metric.coralL2,
  Metric.coralL3,
  Metric.coralL4,
  Metric.processorScores,
  Metric.netScores,
];

interface MatchResultsOutput {
  red: AllianceResultsOutput;
  blue: AllianceResultsOutput;
}

interface AllianceResultsOutput {
  teams: TeamOutput[];
  totalPoints: number;
  coralL1: number;
  coralL2: number;
  coralL3: number;
  coralL4: number;
  processor: number;
  net: number;
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
    coralL1: totals[Metric.coralL1],
    coralL2: totals[Metric.coralL2],
    coralL3: totals[Metric.coralL3],
    coralL4: totals[Metric.coralL4],
    processor: totals[Metric.processorScores],
    net: totals[Metric.netScores],
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
  const out: number[] = [0, 0, 0, 0];

  for (const report of reports) {
    if (report.robotRole === "OFFENSE") out[0] += 1;
    if (report.robotRole === "DEFENSE") out[1] += 1;
    if (report.robotRole === "FEEDER") out[2] += 1;
    if (report.robotRole === "IMMOBILE") out[3] += 1;
  }

  return out;
}
