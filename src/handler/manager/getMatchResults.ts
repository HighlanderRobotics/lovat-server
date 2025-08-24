import { Request, Response } from "express";
import prismaClient from "../../prismaClient";
import z from "zod";
import { TeamMatchData, ScoutReport } from "@prisma/client";

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

    console.log(teams[0].scoutReports);

    const out = {
        
    }

    res.status(200).send(out);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};

type MatchResultsOutput = {
  red: AllianceResultsOutput,
  blue: AllianceResultsOutput
};

type AllianceResultsOutput = {
  teams: TeamOutput[],
  totalPoints: number,
  coralL1: number,
  coralL2: number,
  coralL3: number,
  coralL4: number,
  processor: number,
  net: number
};

type TeamOutput = {
  teamNumber: number,
  pointsScored: number,
  reports: ScoutReport[],
  role: number[]
};

function getTeamOutput(matchData: (TeamMatchData & {scoutReports: ScoutReport[]})) {
  const out: TeamOutput = {
    teamNumber: matchData.teamNumber,
    pointsScored: 10,
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