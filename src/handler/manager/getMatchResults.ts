import { Request, Response } from "express";
import prismaClient from "../../prismaClient";
import z from "zod";
import { TeamMatchData, ScoutReport } from "@prisma/client";
import { averageScoutReport } from "../analysis/coreAnalysis/averageScoutReport";
import { Metric } from "../analysis/analysisConstants";

export const getMatchResults = async (
  req: Request,
  res: Response
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
          key: `${params.matchKey}_${i}`
        },
        include: {
          scoutReports: true
        }
      })
    }

    const out: MatchResultsOutput = {
      red: await getAllianceResults(teams, 0),
      blue: await getAllianceResults(teams, 1)
    }

    res.status(200).send(out);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};

interface MatchResultsOutput {
  red: AllianceResultsOutput,
  blue: AllianceResultsOutput
};

interface AllianceResultsOutput {
  teams: TeamOutput[],
  totalPoints: number,
  coralL1: number,
  coralL2: number,
  coralL3: number,
  coralL4: number,
  processor: number,
  net: number
};

interface TeamOutput {
  teamNumber: number,
  pointsScored: number,
  reports: ScoutReport[],
  role: number[]
};

async function getAllianceResults(matchData: (TeamMatchData & { scoutReports: ScoutReport[] })[], alliance: number) {
  const totals = {
    totalPoints: 0,
    coralL1: 0,
    coralL2: 0,
    coralL3: 0,
    coralL4: 0,
    processor: 0,
    net: 0
  };

  for (let i = 0 + 3 * alliance; i < 3 + 3 * alliance; i++) {
    const teamTotals = {
      totalPoints: 0,
      coralL1: 0,
      coralL2: 0,
      coralL3: 0,
      coralL4: 0,
      processor: 0,
      net: 0
    };

    for (const report of matchData[i].scoutReports) {
      const result = await averageScoutReport(report.uuid, [Metric.totalPoints, Metric.coralL1, Metric.coralL2, Metric.coralL3, Metric.coralL4, Metric.processorScores, Metric.netScores]);
      teamTotals.totalPoints += result[Metric.totalPoints];
      teamTotals.coralL1 += result[Metric.coralL1];
      teamTotals.coralL2 += result[Metric.coralL2];
      teamTotals.coralL3 += result[Metric.coralL3];
      teamTotals.coralL4 += result[Metric.coralL4];
      teamTotals.processor += result[Metric.processorScores];
      teamTotals.net += result[Metric.netScores];
    }

    totals.totalPoints += teamTotals.totalPoints / (matchData[i].scoutReports.length || 1)
    totals.coralL1 += teamTotals.coralL1 / (matchData[i].scoutReports.length || 1)
    totals.coralL2 += teamTotals.coralL2 / (matchData[i].scoutReports.length || 1)
    totals.coralL3 += teamTotals.coralL3 / (matchData[i].scoutReports.length || 1)
    totals.coralL4 += teamTotals.coralL4 / (matchData[i].scoutReports.length || 1)
    totals.processor += teamTotals.processor / (matchData[i].scoutReports.length || 1)
    totals.net += teamTotals.net / (matchData[i].scoutReports.length || 1)
  }

  const out: AllianceResultsOutput = {
    teams: [
      await getTeamResults(matchData[0 + 3 * alliance]),
      await getTeamResults(matchData[1 + 3 * alliance]),
      await getTeamResults(matchData[2 + 3 * alliance]),
    ],
    totalPoints: totals.totalPoints,
    coralL1: totals.coralL1,
    coralL2: totals.coralL2,
    coralL3: totals.coralL3,
    coralL4: totals.coralL4,
    processor: totals.processor,
    net: totals.net
  };

  return out;
}

async function getTeamResults(matchData: TeamMatchData & { scoutReports: ScoutReport[] }) {
  let total = 0;

  for (const report of matchData.scoutReports) {
    const result = await averageScoutReport(report.uuid, [Metric.totalPoints]);
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
  const out: number[] = [0,0,0,0];

  for (let i = 0; i < reports.length; i++) {
    if (reports[i].robotRole == "OFFENSE") {out[0] += 1}
    if (reports[i].robotRole == "DEFENSE") {out[1] += 1}
    if (reports[i].robotRole == "FEEDER") {out[2] += 1}
    if (reports[i].robotRole == "IMMOBILE") {out[3] += 1}
  }
  
  return out;
}