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
  ClimbResult,
  OverBump,
  UnderTrench,
} from "@prisma/client";
import { autoEnd, endgameToPoints } from "../analysisConstants.js";
import { z } from "zod";
import {
  dataSourceRuleToPrismaFilter,
  dataSourceRuleSchema,
} from "../dataSourceRule.js";

interface AggregatedTeamData {
  teamNumber: number;
  mainRole: string;
  secondaryRole: string;
  underTrench: boolean;
  overBump: boolean;
  avgFuelScored: number;
  avgFeedsFromNeutral: number;
  avgFeedsFromOpponent: number;
  avgBlockDefends: number;
  avgCampDefends: number;
  avgDepotIntakes: number;
  avgGroundIntakes: number;
  avgOutpostIntakes: number;
  avgOutpostOuttakes: number;
  avgTeleopPoints: number;
  avgAutoPoints: number;
  avgDriverAbility: number;
  avgShootingAccuracy: number;
  percClimbLeft: number;
  percClimbCenter: number;
  percClimbRight: number;
  percClimbBack: number;
  percClimbOne: number;
  percClimbTwo: number;
  percClimbThree: number;
  percAutoClimb: number;
  percNoClimb: number;
  matchesImmobile: number;
  numMatches: number;
  numReports: number;
}

// Simplified scouting report with properties required for aggregation
interface PointsReport {
  robotRole: RobotRole;
  climbResult: ClimbResult;
  underTrench: UnderTrench;
  overBump: OverBump;
  shootingAccuracy: number;
  driverAbility: number;
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
  res: Response
): Promise<void> => {
  try {
    if (req.user.role !== UserRole.SCOUTING_LEAD) {
      res.status(403).send("Not authorized to download scouting data");
      return;
    }

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
    let eventTimeFilter: { time: { lte?: number; gt?: number } } = undefined;
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
          where: {
            scouter: {
              sourceTeamNumber: dataSourceRuleToPrismaFilter(
                dataSourceRuleSchema(z.number()).parse(req.user.teamSourceRule)
              ),
            },
          },
          select: {
            robotRole: true,
            shootingAccuracy: true,
            underTrench: true,
            overBump: true,
            climbResult: true,
            driverAbility: true,
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
          Object.assign({ weight: 1 / cur.scoutReports.length }, element)
        );
      });

      return acc;
    }, []);

    // Aggregate point values
    const aggregatedData: AggregatedTeamData[] = [];
    groupedByTeam.forEach((group, teamNum) => {
      aggregatedData.push(
        aggregateTeamReports(
          teamNum,
          group.numMatches,
          group.reports,
          includeAuto,
          includeTeleop
        )
      );
    });

    // Create and send the csv string through express
    const csvString = stringify(aggregatedData, {
      header: true,
      // Creates column headers from data properties
      columns: Object.keys(aggregatedData[0]),
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

function aggregateTeamReports(
  teamNum: number,
  numMatches: number,
  reports: PointsReport[],
  includeAuto: boolean,
  includeTeleop: boolean
): AggregatedTeamData {
  const data: AggregatedTeamData = {
    teamNumber: teamNum,
    mainRole: null,
    secondaryRole: null,
    underTrench: false,
    overBump: false,
    avgTeleopPoints: 0,
    avgAutoPoints: 0,
    avgDriverAbility: 0,
    avgShootingAccuracy: 0,
    avgFuelScored: 0,
    avgFeedsFromNeutral: 0,
    avgFeedsFromOpponent: 0,
    avgBlockDefends: 0,
    avgCampDefends: 0,
    avgDepotIntakes: 0,
    avgGroundIntakes: 0,
    avgOutpostIntakes: 0,
    avgOutpostOuttakes: 0,
    percClimbLeft: 0,
    percClimbCenter: 0,
    percClimbRight: 0,
    percClimbBack: 0,
    percClimbOne: 0,
    percClimbTwo: 0,
    percClimbThree: 0,
    percAutoClimb: 0,
    percNoClimb: 0,
    matchesImmobile: 0,
    numMatches: numMatches,
    numReports: reports.length,
  };

  // Out of scope iteration variables
  const roles: Record<RobotRole, number> = {
    OFFENSE: 0,
    DEFENSE: 0,
    FEEDER: 0,
    IMMOBILE: 0,
  };

  let underTrench: UnderTrench = UnderTrench.NO;
  let overBump: OverBump = OverBump.NO;

  // Main iteration for most aggregation summing
  reports.forEach((report) => {
    // Sum driver ability and robot role
    data.avgDriverAbility += report.driverAbility * report.weight;
    roles[report.robotRole] += report.weight;

    // Set discrete robot capabilities
    // Implement a safety for this? One incorrect report could mess up the data
    data.underTrench ||= report.underTrench === UnderTrench.YES;
    data.overBump ||= report.overBump === OverBump.YES;

    // Sum endgame results
    switch (report.climbResult) {
      case ClimbResult.LEFT_ONE:
        data.percClimbLeft += report.weight;
        data.percClimbOne += report.weight;
        break;
      case ClimbResult.LEFT_TWO:
        data.percClimbLeft += report.weight;
        data.percClimbTwo += report.weight;
        break;
      case ClimbResult.LEFT_THREE:
        data.percClimbLeft += report.weight;
        data.percClimbThree += report.weight;
        break;
      case ClimbResult.MIDDLE_TWO:
        data.percClimbCenter += report.weight;
        data.percClimbTwo += report.weight;
        break;
      case ClimbResult.MIDDLE_THREE:
        data.percClimbCenter += report.weight;
        data.percClimbThree += report.weight;
        break;
      case ClimbResult.RIGHT_ONE:
        data.percClimbRight += report.weight;
        data.percClimbOne += report.weight;
        break;
      case ClimbResult.RIGHT_TWO:
        data.percClimbRight += report.weight;
        data.percClimbTwo += report.weight;
        break;
      case ClimbResult.RIGHT_THREE:
        data.percClimbRight += report.weight;
        data.percClimbThree += report.weight;
        break;
      case ClimbResult.BACK_ONE:
        data.percClimbBack += report.weight;
        data.percClimbOne += report.weight;
        break;
      case ClimbResult.BACK_TWO:
        data.percClimbBack += report.weight;
        data.percClimbTwo += report.weight;
        break;
      case ClimbResult.BACK_THREE:
        data.percClimbBack += report.weight;
        data.percClimbThree += report.weight;
        break;
      case ClimbResult.NOT_ATTEMPTED:
        data.percNoClimb += report.weight;
        break;
    }

    // Sum match points and actions
    report.events.forEach((event) => {
      if (event.time <= autoEnd) {
        data.avgAutoPoints += event.points * report.weight;
      } else {
        data.avgTeleopPoints += event.points * report.weight;
      }

      switch (event.action) {
        case EventAction.SCORE_FUEL:
          data.avgFuelScored += event.points * report.weight;
          break;
        case EventAction.FEED_NEUTRAL:
          data.avgFeedsFromNeutral += 1 * report.weight;
          break;
        case EventAction.FEED_OPPONENT:
          data.avgFeedsFromOpponent += 1 * report.weight;
          break;
        case EventAction.DEFEND_BLOCK:
          data.avgBlockDefends += 1 * report.weight;
          break;
        case EventAction.DEFEND_CAMP:
          data.avgCampDefends += 1 * report.weight;
          break;
        case EventAction.DEPOT_INTAKE:
          data.avgDepotIntakes += 1 * report.weight;
          break;
        case EventAction.GROUND_INTAKE:
          data.avgGroundIntakes += 1 * report.weight;
          break;
        case EventAction.OUTPOST_INTAKE:
          data.avgOutpostIntakes += 1 * report.weight;
          break;
        case EventAction.OUTPOST_OUTTAKE:
          data.avgOutpostOuttakes += 1 * report.weight;
          break;
      }

      // FIX: This will only work if all reports for a match mark robot role as offense
      // if (report.robotRole === RobotRole.OFFENSE) {
      //     data.avgOffensePoints += event.points * report.weight;
      // }
    });
  });

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
          data.secondaryRole = data.mainRole;

          // Push new role to main
          highestOccurences[0] = role[1];
          data.mainRole = role[0];
        } else {
          // Push new role to secondary
          highestOccurences[1] = role[1];
          data.secondaryRole = role[0];
        }
      }

      return highestOccurences;
    },
    [0, 0]
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

  data.avgTeleopPoints = roundToHundredth(data.avgTeleopPoints / numMatches);
  data.avgAutoPoints = roundToHundredth(data.avgAutoPoints / numMatches);
  data.avgDriverAbility = roundToHundredth(data.avgDriverAbility / numMatches);
  data.avgShootingAccuracy = roundToHundredth(
    data.avgShootingAccuracy / numMatches
  );
  data.avgFuelScored = roundToHundredth(data.avgFuelScored / numMatches);
  data.avgFeedsFromNeutral = roundToHundredth(
    data.avgFeedsFromNeutral / numMatches
  );
  data.avgFeedsFromOpponent = roundToHundredth(
    data.avgFeedsFromOpponent / numMatches
  );
  data.avgBlockDefends = roundToHundredth(data.avgBlockDefends / numMatches);
  data.avgCampDefends = roundToHundredth(data.avgCampDefends / numMatches);
  data.avgDepotIntakes = roundToHundredth(data.avgDepotIntakes / numMatches);
  data.avgGroundIntakes = roundToHundredth(data.avgGroundIntakes / numMatches);
  data.avgOutpostIntakes = roundToHundredth(
    data.avgOutpostIntakes / numMatches
  );
  data.avgOutpostOuttakes = roundToHundredth(
    data.avgOutpostOuttakes / numMatches
  );

  // Convert climb counts to percentages

  data.percClimbLeft = roundToHundredth(
    (data.percClimbLeft / numMatches) * 100
  );
  data.percClimbCenter = roundToHundredth(
    (data.percClimbCenter / numMatches) * 100
  );
  data.percClimbRight = roundToHundredth(
    (data.percClimbRight / numMatches) * 100
  );
  data.percClimbBack = roundToHundredth(
    (data.percClimbBack / numMatches) * 100
  );
  data.percClimbOne = roundToHundredth((data.percClimbOne / numMatches) * 100);
  data.percClimbTwo = roundToHundredth((data.percClimbTwo / numMatches) * 100);
  data.percClimbThree = roundToHundredth(
    (data.percClimbThree / numMatches) * 100
  );
  data.percAutoClimb = roundToHundredth(
    (data.percAutoClimb / numMatches) * 100
  );
  data.percNoClimb = roundToHundredth((data.percNoClimb / numMatches) * 100);

  // Add endgame points to total points
  if (includeTeleop && includeAuto) {
    data.avgTeleopPoints +=
      (data.percClimbOne * endgameToPoints[ClimbResult.LEFT_ONE] +
        data.percClimbTwo * endgameToPoints[ClimbResult.LEFT_TWO] +
        data.percClimbThree * endgameToPoints[ClimbResult.LEFT_THREE]) /
      100;
  }

  // Trim remaining datapoints
  data.avgTeleopPoints = roundToHundredth(data.avgTeleopPoints);
  data.matchesImmobile = roundToHundredth(data.matchesImmobile);

  return data;
}

function roundToHundredth(a: number): number {
  return Math.round(a * 100) / 100;
}
