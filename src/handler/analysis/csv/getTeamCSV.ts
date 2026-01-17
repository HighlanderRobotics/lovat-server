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
  EndgameClimbResult,
  AutoClimbResult,
  FieldTraversal,
} from "@prisma/client";
import { autoEnd, endgameToPoints } from "../analysisConstants.js";
import { z } from "zod";
import {
  dataSourceRuleToPrismaFilter,
  dataSourceRuleSchema,
} from "../dataSourceRule.js";
import { Field } from "@slack/web-api/dist/types/response/ChannelsHistoryResponse.js";

interface AggregatedTeamData {
  teamNumber: number;
  mainRole: string;
  secondaryRole: string;
  fieldTraversal: string;
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
  percClimbOne: number;
  percClimbTwo: number;
  percClimbThree: number;
  percClimbFailed: number;
  percAutoClimb: number;
  percNoClimb: number;
  matchesImmobile: number;
  numMatches: number;
  numReports: number;
}

// Simplified scouting report with properties required for aggregation
interface PointsReport {
  robotRole: RobotRole;
  endgameClimbResult: EndgameClimbResult;
  autoClimbResult: AutoClimbResult;
  fieldTraversal: FieldTraversal;
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
            endgameClimbResult: true,
            autoClimbResult: true,
            fieldTraversal: true,
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
    fieldTraversal: null,
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
    percClimbOne: 0,
    percClimbTwo: 0,
    percClimbThree: 0,
    percClimbFailed: 0,
    percAutoClimb: 0,
    percNoClimb: 0,
    matchesImmobile: 0,
    numMatches: numMatches,
    numReports: reports.length,
  };

  // Out of scope iteration variables
  const roles: Record<RobotRole, number> = {
    FEEDING: 0,
    STEALING: 0,
    SCORING: 0,
    DEFENDING: 0,
    CYCLING: 0,
    IMMOBILE: 0,
  };

  // Main iteration for most aggregation summing
  reports.forEach((report) => {
    // Sum driver ability and robot role
    data.avgDriverAbility += report.driverAbility * report.weight;
    roles[report.robotRole] += report.weight;

    // Set discrete robot capabilities
    // Implement a safety for this? One incorrect report could mess up the data
    switch (report.fieldTraversal) {
      case FieldTraversal.TRENCH:
        data.fieldTraversal =
          data.fieldTraversal === FieldTraversal.BUMP
            ? FieldTraversal.BOTH
            : FieldTraversal.TRENCH;
        break;
      case FieldTraversal.BUMP:
        data.fieldTraversal =
          data.fieldTraversal === FieldTraversal.TRENCH
            ? FieldTraversal.BOTH
            : FieldTraversal.BUMP;
        break;
      case FieldTraversal.BOTH:
        data.fieldTraversal = FieldTraversal.BOTH;
        break;
    }

    // Sum endgame results
    switch (report.endgameClimbResult) {
      case EndgameClimbResult.LEVEL_ONE:
        data.percClimbOne += report.weight;
        break;
      case EndgameClimbResult.LEVEL_TWO:
        data.percClimbTwo += report.weight;
        break;
      case EndgameClimbResult.LEVEL_THREE:
        data.percClimbThree += report.weight;
        break;
      case EndgameClimbResult.FAILED:
        data.percClimbFailed += report.weight;
        break;
      case EndgameClimbResult.NOT_ATTEMPTED:
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
        case EventAction.START_FEEDING:
          if (event.position === Position.NEUTRAL_ZONE) {
            data.avgFeedsFromNeutral += 1 * report.weight;
          } else if (event.position === Position.FIRST_RUNG) {
            data.avgFeedsFromOpponent += 1 * report.weight;
          }
          break;
      }
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
      (data.percClimbOne * endgameToPoints[EndgameClimbResult.LEVEL_ONE] +
        data.percClimbTwo * endgameToPoints[EndgameClimbResult.LEVEL_TWO] +
        data.percClimbThree * endgameToPoints[EndgameClimbResult.LEVEL_THREE]) /
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
