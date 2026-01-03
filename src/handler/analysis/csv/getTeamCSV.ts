import { Response } from "express";
import prismaClient from "@/src/prismaClient.js";
import { AuthenticatedRequest } from "@/src/lib/middleware/requireAuth.js";
import { stringify } from "csv-stringify/sync";
import {
  UserRole,
  RobotRole,
  EventAction,
  Position,
  AlgaePickup,
  CoralPickup,
  BargeResult,
  KnocksAlgae,
  UnderShallowCage,
  Event,
} from "@prisma/client";
import { autoEnd, endgameToPoints } from "@/src/handler/analysis/analysisConstants.js";
import { z } from "zod";
import {
  dataSourceRuleToPrismaFilter,
  dataSourceRuleSchema,
} from "@/src/handler/analysis/dataSourceRule.js";

interface AggregatedTeamData {
  teamNumber: number;
  mainRole: string;
  secondaryRole: string;
  coralPickup: string;
  algaePickup: string;
  algaeKnocking: boolean;
  underShallowCage: boolean;
  avgTeleopPoints: number;
  avgAutoPoints: number;
  avgDriverAbility: number;
  avgFeeds: number;
  avgDefends: number;
  avgCoralPickups: number;
  avgAlgaePickups: number;
  avgCoralDrops: number;
  avgAlgaeDrops: number;
  avgCoralL1: number;
  avgCoralL2: number;
  avgCoralL3: number;
  avgCoralL4: number;
  avgProcessorScores: number;
  avgNetScores: number;
  avgNetFails: number;
  // avgOffensePoints: number - idea to calculate avgPoints only during offense matches, breaks down with conflicting role reports
  percActiveAutons: number;
  percBargeNone: number;
  percBargePark: number;
  percBargeShallow: number;
  percBargeDeep: number;
  percBargeFail: number;
  matchesImmobile: number;
  numMatches: number;
  numReports: number;
}

// Simplified scouting report with properties required for aggregation
interface PointsReport {
  robotRole: RobotRole;
  algaePickup: AlgaePickup;
  coralPickup: CoralPickup;
  bargeResult: BargeResult;
  knocksAlgae: KnocksAlgae;
  underShallowCage: UnderShallowCage;
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
  res: Response,
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
                dataSourceRuleSchema(z.number()).parse(req.user.teamSourceRule),
              ),
            },
          },
          select: {
            robotRole: true,
            algaePickup: true,
            coralPickup: true,
            bargeResult: true,
            knocksAlgae: true,
            underShallowCage: true,
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
          Object.assign({ weight: 1 / cur.scoutReports.length }, element),
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
          includeTeleop,
        ),
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

// Less verbose and don't want to create new arrays constantly
const posL1: Position[] = [
  Position.LEVEL_ONE_A,
  Position.LEVEL_ONE_B,
  Position.LEVEL_ONE_C,
];
const posL2: Position[] = [
  Position.LEVEL_TWO_A,
  Position.LEVEL_TWO_B,
  Position.LEVEL_TWO_C,
];
const posL3: Position[] = [
  Position.LEVEL_THREE_A,
  Position.LEVEL_THREE_B,
  Position.LEVEL_THREE_C,
];

function aggregateTeamReports(
  teamNum: number,
  numMatches: number,
  reports: PointsReport[],
  includeAuto: boolean,
  includeTeleop: boolean,
): AggregatedTeamData {
  const data: AggregatedTeamData = {
    teamNumber: teamNum,
    mainRole: null,
    secondaryRole: null,
    coralPickup: null,
    algaePickup: null,
    algaeKnocking: false,
    underShallowCage: false,
    avgTeleopPoints: 0,
    avgAutoPoints: 0,
    avgDriverAbility: 0,
    avgFeeds: 0,
    avgDefends: 0,
    avgCoralPickups: 0,
    avgAlgaePickups: 0,
    avgCoralDrops: 0,
    avgAlgaeDrops: 0,
    avgCoralL1: 0,
    avgCoralL2: 0,
    avgCoralL3: 0,
    avgCoralL4: 0,
    avgProcessorScores: 0,
    avgNetScores: 0,
    avgNetFails: 0,
    percActiveAutons: 0,
    percBargeNone: 0,
    percBargePark: 0,
    percBargeShallow: 0,
    percBargeDeep: 0,
    percBargeFail: 0,
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
  let coral: CoralPickup = CoralPickup.NONE;
  let algae: AlgaePickup = AlgaePickup.NONE;

  // Main iteration for most aggregation summing
  reports.forEach((report) => {
    // Sum driver ability and robot role
    data.avgDriverAbility += report.driverAbility * report.weight;
    roles[report.robotRole] += report.weight;

    // Set discrete robot capabilities
    // Implement a safety for this? One incorrect report could mess up the data
    data.algaeKnocking ||= report.knocksAlgae === KnocksAlgae.YES;
    data.underShallowCage ||= report.underShallowCage === UnderShallowCage.YES;
    if (coral === CoralPickup.NONE) {
      coral = report.coralPickup;
    } else if (
      coral !== report.coralPickup &&
      report.coralPickup !== CoralPickup.NONE
    ) {
      coral === CoralPickup.BOTH;
    }
    if (algae === AlgaePickup.NONE) {
      algae = report.algaePickup;
    } else if (
      algae !== report.algaePickup &&
      report.algaePickup !== AlgaePickup.NONE
    ) {
      algae === AlgaePickup.BOTH;
    }

    // Sum endgame results
    switch (report.bargeResult) {
      case BargeResult.NOT_ATTEMPTED:
        data.percBargeNone += report.weight;
        break;
      case BargeResult.PARKED:
        data.percBargePark += report.weight;
        break;
      case BargeResult.SHALLOW:
        data.percBargeShallow += report.weight;
        break;
      case BargeResult.DEEP:
        data.percBargeDeep += report.weight;
        break;
      default:
        data.percBargeFail += report.weight;
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
        case EventAction.PICKUP_CORAL:
          data.avgCoralPickups += report.weight;
          break;
        case EventAction.PICKUP_ALGAE:
          data.avgAlgaePickups += report.weight;
          break;
        case EventAction.FEED:
          data.avgFeeds += report.weight;
          break;
        case EventAction.AUTO_LEAVE:
          data.percActiveAutons += report.weight;
          break;
        case EventAction.DEFEND:
          data.avgDefends += report.weight;
          break;
        case EventAction.SCORE_NET:
          data.avgNetScores += report.weight;
          break;
        case EventAction.FAIL_NET:
          data.avgNetFails += report.weight;
          break;
        case EventAction.SCORE_PROCESSOR:
          data.avgProcessorScores += report.weight;
          break;
        case EventAction.SCORE_CORAL:
          switch (event.position) {
            case Position.LEVEL_ONE:
              data.avgCoralL1 += report.weight;
              break;
            case Position.LEVEL_TWO:
              data.avgCoralL2 += report.weight;
              break;
            case Position.LEVEL_THREE:
              data.avgCoralL3 += report.weight;
              break;
            case Position.LEVEL_FOUR:
              data.avgCoralL4 += report.weight;
              break;
            default:
              // During auto
              if (posL1.includes(event.position)) {
                data.avgCoralL1 += report.weight;
              } else if (posL2.includes(event.position)) {
                data.avgCoralL2 += report.weight;
              } else if (posL3.includes(event.position)) {
                data.avgCoralL3 += report.weight;
              } else {
                data.avgCoralL4 += report.weight;
              }
              break;
          }
          break;
        case EventAction.DROP_ALGAE:
          data.avgAlgaeDrops += report.weight;
          break;
        case EventAction.DROP_CORAL:
          data.avgCoralDrops += report.weight;
          break;
      }

      // FIX: This will only work if all reports for a match mark robot role as offense
      // if (report.robotRole === RobotRole.OFFENSE) {
      //     data.avgOffensePoints += event.points * report.weight;
      // }
    });
  });

  data.coralPickup = coral;
  data.algaePickup = algae;

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

  data.avgTeleopPoints = roundToHundredth(data.avgTeleopPoints / numMatches);
  data.avgAutoPoints = roundToHundredth(data.avgAutoPoints / numMatches);
  data.avgDriverAbility = roundToHundredth(data.avgDriverAbility / numMatches);
  data.avgFeeds = roundToHundredth(data.avgFeeds / numMatches);
  data.avgDefends = roundToHundredth(data.avgDefends / numMatches);
  data.avgCoralPickups = roundToHundredth(data.avgCoralPickups / numMatches);
  data.avgAlgaePickups = roundToHundredth(data.avgAlgaePickups / numMatches);
  data.avgCoralDrops = roundToHundredth(data.avgCoralDrops / numMatches);
  data.avgAlgaeDrops = roundToHundredth(data.avgAlgaeDrops / numMatches);
  data.avgCoralL1 = roundToHundredth(data.avgCoralL1 / numMatches);
  data.avgCoralL2 = roundToHundredth(data.avgCoralL2 / numMatches);
  data.avgCoralL3 = roundToHundredth(data.avgCoralL3 / numMatches);
  data.avgCoralL4 = roundToHundredth(data.avgCoralL4 / numMatches);
  data.avgProcessorScores = roundToHundredth(
    data.avgProcessorScores / numMatches,
  );
  data.avgNetScores = roundToHundredth(data.avgNetScores / numMatches);
  data.avgNetFails = roundToHundredth(data.avgNetFails / numMatches);
  // data.avgOffensePoints = roundToHundredth(data.avgOffensePoints / numMatches);

  data.percActiveAutons =
    Math.round((data.percActiveAutons / numMatches) * 1000) / 10;
  data.percBargeNone =
    Math.round((data.percBargeNone / numMatches) * 1000) / 10;
  data.percBargePark =
    Math.round((data.percBargePark / numMatches) * 1000) / 10;
  data.percBargeShallow =
    Math.round((data.percBargeShallow / numMatches) * 1000) / 10;
  data.percBargeDeep =
    Math.round((data.percBargeDeep / numMatches) * 1000) / 10;
  data.percBargeFail =
    Math.round((data.percBargeFail / numMatches) * 1000) / 10;

  // Add endgame points to total points
  if (includeTeleop && includeAuto) {
    data.avgTeleopPoints +=
      (data.percBargePark * endgameToPoints[BargeResult.PARKED] +
        data.percBargeShallow * endgameToPoints[BargeResult.SHALLOW] +
        data.percBargeDeep * endgameToPoints[BargeResult.DEEP]) /
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
