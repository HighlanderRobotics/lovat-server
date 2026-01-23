import { Response } from "express";
import prismaClient from "../../../prismaClient.js";
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth.js";
import { stringify } from "csv-stringify/sync";
import {
  UserRole,
  RobotRole,
  EventAction,
  Position,
  Event,
  AutoClimb,
  Mobility,
  EndgameClimb,
  Beached,
  ClimbPosition,
  ClimbSide,
  FeederType,
  IntakeType,
  Scouter,
  TeamMatchData,
} from "@prisma/client";
import { autoEnd, endgameToPoints, Metric } from "../analysisConstants.js";
import { z } from "zod";
import {
  dataSourceRuleToPrismaFilter,
  dataSourceRuleSchema,
} from "../dataSourceRule.js";
import { averageManyFast } from "../coreAnalysis/averageManyFast.js";

interface AggregatedTeamData {
  teamNumber: number;
  mainRole: string;
  secondaryRole: string;
  mobility: string;
  avgTotalPoints: number;
  avgAutoPoints: number;
  avgTeleopPoints: number;
  avgFuelPerSecond: number;
  avgAccuracy: number;
  avgVolleysPerMatch: number;
  avgL1StartTime: number;
  avgL2StartTime: number;
  avgL3StartTime: number;
  avgAutoClimbStartTime: number;
  avgDriverAbility: number;
  avgContactDefenseTime: number;
  avgDefenseEffectiveness: number;
  avgCampingDefenseTime: number;
  avgTotalDefenseTime: number;
  avgTimeFeeding: number;
  avgFeedingRate: number;
  avgFeedsPerMatch: number;
  avgTotalFuelOutputted: number;
  avgTotalBallsFed: number;
  avgTotalBallThroughput: number;
  avgOutpostIntakes: number;
  percDisrupts: number;
  percScoresWhileMoving: number;
  percClimbOne: number;
  percClimbTwo: number;
  percClimbThree: number;
  percNoClimb: number;
  percAutoClimb: number;
  matchesImmobile: number;
  numMatches: number;
  numReports: number;
}

// Simplified scouting report with properties required for aggregation
interface PointsReport {
  uuid: string;
  robotRoles: RobotRole[];
  autoClimb: AutoClimb;
  endgameClimb: EndgameClimb;
  mobility: Mobility;
  beached: Beached;
  climbSide: ClimbSide;
  climbPosition: ClimbPosition;
  scoresWhileMoving: boolean;
  disrupts: boolean;
  feederTypes: FeederType[];
  intakeType: IntakeType;
  driverAbility: number;
  accuracy: number;
  defenseEffectiveness: number;
  events: Partial<Event>[];
  // This property represents the weighting of this report in the final aggregation [0..1]
  weight: number;
}
/**
 * Sends csv file of rows of AggregatedTeamData instances, representing a single team over all reports.
 * Uses data from queried tournament and user's teamSource. Available to Scouting Leads.
 * Non-averaged results default to highest report, except in the case of robot roles.
 */
export const getTeamCSV = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    // Data will only be sourced from a tournament as sent with the request
    const params = z
      .object({
        tournamentKey: z.string(),
      })
      .safeParse({
        tournamentKey: req.query.tournamentKey,
      });

    if (!params.success) {
      res
        .status(400)
        .send({ error: params, displayError: "Invalid tournament selected." });
      return;
    }

    // Note: passing neither value should act the same as passing both
    const auto = req.query.auto !== undefined;
    const teleop = req.query.teleop !== undefined;
    const includeAuto = auto || !(auto || teleop);
    const includeTeleop = teleop || !(auto || teleop);

    // Time filter for event counting
    let eventTimeFilter: { time: { lte?: number; gt?: number } } | undefined = undefined;
    if (includeAuto && !includeTeleop) {
      eventTimeFilter = {
        time: {
          lte: autoEnd,
        },
      };
    } else if (includeTeleop && !includeAuto) {
      eventTimeFilter = {
        time: {
          gt: autoEnd,
        },
      };
    }

    // TMD instances will be sorted by team number and then looped through and aggregated
    const datapoints = await prismaClient.teamMatchData.findMany({
      where: {
        tournamentKey: params.data.tournamentKey,
      },
      select: {
        teamNumber: true,
            scoutReports: {
              where: (() => {
                const parsed = dataSourceRuleSchema(z.number()).safeParse(
                  req.user?.teamSourceRule,
                );
                if (!parsed.success) return {};
                const filter = dataSourceRuleToPrismaFilter(parsed.data);
                return filter
                  ? { scouter: { sourceTeamNumber: filter } }
                  : {};
              })(),
              select: {
                uuid: true,
                robotRoles: true,
                accuracy: true,
                endgameClimb: true,
                autoClimb: true,
                mobility: true,
                driverAbility: true,
                defenseEffectiveness: true,
                beached: true,
                climbSide: true,
                climbPosition: true,
                scoresWhileMoving: true,
                disrupts: true,
                feederTypes: true,
                intakeType: true,
                events: {
                  where: eventTimeFilter,
                  select: {
                    time: true,
                    action: true,
                    position: true,
                    points: true,
                  },
                },
              },
            },
      },
      orderBy: {
        teamNumber: "asc",
      },
    });

    if (datapoints.length === 0) {
      res.status(400).send("Not enough scouting data from provided sources");
      return;
    }

    // Group reports by team number in a sparse array
    const groupedByTeam = datapoints.reduce<
      { reports: PointsReport[]; numMatches: number }[]
    >((acc, cur) => {
      acc[cur.teamNumber] ||= { reports: [], numMatches: 0 };

      // Increment number of matches for team
      if (cur.scoutReports.length > 0) {
        acc[cur.teamNumber].numMatches++;
      }

      // Push reports for team from match
      cur.scoutReports.forEach((element) => {
        acc[cur.teamNumber].reports.push(
          Object.assign({ weight: 1 / cur.scoutReports.length }, element),
        );
      });

      return acc;
    }, []);

    // Compute metrics using averageManyFast for all teams
    const teams = groupedByTeam
      .map((_, teamNum) => teamNum)
      .filter((t) => groupedByTeam[t]?.reports?.length);
    const metrics: Metric[] = [
      Metric.totalPoints,
      Metric.autoPoints,
      Metric.teleopPoints,
      Metric.driverAbility,
      Metric.accuracy,
      Metric.defenseEffectiveness,
      Metric.fuelPerSecond,
      Metric.volleysPerMatch,
      Metric.l1StartTime,
      Metric.l2StartTime,
      Metric.l3StartTime,
      Metric.autoClimbStartTime,
      Metric.contactDefenseTime,
      Metric.campingDefenseTime,
      Metric.totalDefenseTime,
      Metric.timeFeeding,
      Metric.feedingRate,
      Metric.feedsPerMatch,
      Metric.totalFuelOutputted,
      Metric.totalBallsFed,
      Metric.totalBallThroughput,
      Metric.outpostIntakes,
    ];

    const fast = (await averageManyFast(req.user, {
      teams,
      metrics,
    })) as Record<string, Record<string, number>>;

    // Aggregate point values
    const aggregatedData: AggregatedTeamData[] = await Promise.all(
      teams.map((teamNum) => {
        const group = groupedByTeam[teamNum];
        return aggregateTeamReports(
          teamNum,
          group.numMatches,
          group.reports,
          includeAuto,
          includeTeleop,
          fast,
        );
      }),
    );
    const csvString = stringify(aggregatedData, {
      header: true,
      // Creates column headers from data properties
      columns: aggregatedData.length ? Object.keys(aggregatedData[0]) : [],
      // Required for excel viewing
      bom: true,
      // Rename boolean values to TRUE and FALSE
      cast: {
        boolean: (b) => (b ? "TRUE" : "FALSE"),
      },
      // Turn off quotation marks
      quote: false,
    });

    res.attachment("teamDataDownload.csv");
    res.header("Content-Type", "text/csv");
    res.send(csvString);
    return;
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};

async function aggregateTeamReports(
  teamNum: number,
  numMatches: number,
  reports: PointsReport[],
  includeAuto: boolean,
  includeTeleop: boolean,
  fast: Record<string, Record<string, number>>,
): Promise<AggregatedTeamData> {
  const data: AggregatedTeamData = {
    teamNumber: teamNum,
    mainRole: null,
    secondaryRole: null,
    mobility: null,
    avgTotalPoints: 0,
    avgAutoPoints: 0,
    avgTeleopPoints: 0,
    avgFuelPerSecond: 0,
    avgAccuracy: 0,
    avgVolleysPerMatch: 0,
    avgL1StartTime: 0,
    avgL2StartTime: 0,
    avgL3StartTime: 0,
    avgAutoClimbStartTime: 0,
    avgDriverAbility: 0,
    avgContactDefenseTime: 0,
    avgDefenseEffectiveness: 0,
    avgCampingDefenseTime: 0,
    avgTotalDefenseTime: 0,
    avgTimeFeeding: 0,
    avgFeedingRate: 0,
    avgFeedsPerMatch: 0,
    avgTotalFuelOutputted: 0,
    avgTotalBallsFed: 0,
    avgTotalBallThroughput: 0,
    avgOutpostIntakes: 0,
    percDisrupts: 0,
    percScoresWhileMoving: 0,
    percClimbOne: 0,
    percClimbTwo: 0,
    percClimbThree: 0,
    percNoClimb: 0,
    percAutoClimb: 0,
    matchesImmobile: 0,
    numMatches: 0,
    numReports: 0,
  };

  // Out of scope iteration variables
  const roles: Record<RobotRole, number> = {
    FEEDING: 0,
    SCORING: 0,
    DEFENDING: 0,
    CYCLING: 0,
    IMMOBILE: 0,
  };

  // Main iteration for most aggregation summing (roles, mobility, perc flags)
  reports.forEach((report) => {
    for (const role of report.robotRoles || []) {
      roles[role] += report.weight / (report.robotRoles.length || 1);
    }

    switch (report.mobility) {
      case Mobility.TRENCH:
        data.mobility =
          data.mobility === Mobility.BUMP ? Mobility.BOTH : Mobility.TRENCH;
        break;
      case Mobility.BUMP:
        data.mobility =
          data.mobility === Mobility.TRENCH ? Mobility.BOTH : Mobility.BUMP;
        break;
      case Mobility.BOTH:
        data.mobility = Mobility.BOTH;
        break;
    }

    data.percDisrupts += report.disrupts ? report.weight : 0;
    data.percScoresWhileMoving += report.scoresWhileMoving ? report.weight : 0;

    switch (report.endgameClimb) {
      case EndgameClimb.L1:
        data.percClimbOne += report.weight;
        break;
      case EndgameClimb.L2:
        data.percClimbTwo += report.weight;
        break;
      case EndgameClimb.L3:
        data.percClimbThree += report.weight;
        break;
      case EndgameClimb.NOT_ATTEMPTED:
        data.percNoClimb += report.weight;
        break;
    }

    data.percAutoClimb +=
      report.autoClimb === AutoClimb.SUCCEEDED ? report.weight : 0;
  });

  // Populate averages from averageManyFast for this team
  const t = String(teamNum);
  const getMetric = (m: Metric) => fast?.[String(m)]?.[t] ?? 0;
  data.avgTotalPoints = roundToHundredth(getMetric(Metric.totalPoints));
  data.avgAutoPoints = roundToHundredth(getMetric(Metric.autoPoints));
  data.avgTeleopPoints = roundToHundredth(getMetric(Metric.teleopPoints));
  data.avgDriverAbility = roundToHundredth(getMetric(Metric.driverAbility));
  data.avgAccuracy = roundToHundredth(getMetric(Metric.accuracy));
  data.avgDefenseEffectiveness = roundToHundredth(
    getMetric(Metric.defenseEffectiveness),
  );
  data.avgFuelPerSecond = roundToHundredth(getMetric(Metric.fuelPerSecond));
  data.avgVolleysPerMatch = roundToHundredth(getMetric(Metric.volleysPerMatch));
  data.avgL1StartTime = roundToHundredth(getMetric(Metric.l1StartTime));
  data.avgL2StartTime = roundToHundredth(getMetric(Metric.l2StartTime));
  data.avgL3StartTime = roundToHundredth(getMetric(Metric.l3StartTime));
  data.avgAutoClimbStartTime = roundToHundredth(
    getMetric(Metric.autoClimbStartTime),
  );
  data.avgContactDefenseTime = roundToHundredth(
    getMetric(Metric.contactDefenseTime),
  );
  data.avgCampingDefenseTime = roundToHundredth(
    getMetric(Metric.campingDefenseTime),
  );
  data.avgTotalDefenseTime = roundToHundredth(
    getMetric(Metric.totalDefenseTime),
  );
  data.avgTimeFeeding = roundToHundredth(getMetric(Metric.timeFeeding));
  data.avgFeedingRate = roundToHundredth(getMetric(Metric.feedingRate));
  data.avgFeedsPerMatch = roundToHundredth(getMetric(Metric.feedsPerMatch));
  data.avgTotalFuelOutputted = roundToHundredth(
    getMetric(Metric.totalFuelOutputted),
  );
  data.avgTotalBallsFed = roundToHundredth(getMetric(Metric.totalBallsFed));
  data.avgTotalBallThroughput = roundToHundredth(
    getMetric(Metric.totalBallThroughput),
  );
  data.avgOutpostIntakes = roundToHundredth(getMetric(Metric.outpostIntakes));

  data.matchesImmobile = roles.IMMOBILE || 0;
  // Remove IMMOBILE state from main roles
  delete roles.IMMOBILE;

  // Main method to find highest reported roles
  const highestOccurences = Object.entries(roles).reduce(
    (highestOccurences, role) => {
      // Using >= gives precedence to lower-indexed roles (defense, feeder)
      if (role[1] >= highestOccurences[1]) {
        if (role[1] >= highestOccurences[0]) {
          // Push main role to secondary
          highestOccurences[1] = highestOccurences[0];
          data.secondaryRole = data.mainRole as RobotRole | "NONE" | null;

          // Push new role to main
          highestOccurences[0] = role[1];
          data.mainRole = role[0] as RobotRole;
        } else {
          // Push new role to secondary
          highestOccurences[1] = role[1];
          data.secondaryRole = role[0] as RobotRole;
        }
      }

      return highestOccurences;
    },
    [0, 0],
  );

  // Failsafe if robot lacks reports for enough roles
  if (highestOccurences[1] === 0) {
    data.secondaryRole = "NONE";
    if (highestOccurences[0] === 0) {
      data.mainRole = RobotRole.IMMOBILE;
    }
  }

  // Divide relevent sums by number of matches to get mean
  // Don't divide by 0
  numMatches ||= 1;
  // Populate counters in output
  data.numMatches = numMatches;
  data.numReports = reports.length;

  // Do not divide fast-derived per-match averages again
  // avgTotalPoints already populated from fast and includes endgame
  // Adjust teleop points to include endgame climb points if both phases are included
  if (includeTeleop && includeAuto) {
    data.avgTeleopPoints +=
      (data.percClimbOne * endgameToPoints[EndgameClimb.L1] +
        data.percClimbTwo * endgameToPoints[EndgameClimb.L2] +
        data.percClimbThree * endgameToPoints[EndgameClimb.L3]) /
      100;
  }

  // Convert climb counts to percentages
  data.percDisrupts = roundToHundredth((data.percDisrupts / numMatches) * 100);
  data.percScoresWhileMoving = roundToHundredth(
    (data.percScoresWhileMoving / numMatches) * 100,
  );
  data.percClimbOne = roundToHundredth((data.percClimbOne / numMatches) * 100);
  data.percClimbTwo = roundToHundredth((data.percClimbTwo / numMatches) * 100);
  data.percClimbThree = roundToHundredth(
    (data.percClimbThree / numMatches) * 100,
  );
  data.percAutoClimb = roundToHundredth(
    (data.percAutoClimb / numMatches) * 100,
  );
  data.percNoClimb = roundToHundredth((data.percNoClimb / numMatches) * 100);

  // Trim remaining datapoints
  data.avgTeleopPoints = roundToHundredth(data.avgTeleopPoints);
  data.matchesImmobile = roundToHundredth(data.matchesImmobile);

  return data;
}

function roundToHundredth(a: number): number {
  return Math.round(a * 100) / 100;
}
