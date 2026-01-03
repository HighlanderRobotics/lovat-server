import { Response } from "express";
import prismaClient from "../../../prismaClient.js";
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth.js";
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
  Scouter,
  Event,
} from "@prisma/client";
import {
  autoEnd,
  endgameToPoints,
} from "../analysisConstants.js";
import { z } from "zod";
import { CondensedReport } from "./getReportCSV.js";
import {
  dataSourceRuleToPrismaFilter,
  dataSourceRuleSchema,
} from "../dataSourceRule.js";

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
  scouter: Partial<Scouter>;
}

/**
 * Sends csv file of rows of AggregatedTeamMatchData instances, representing a single match for a single team.
 * Uses data from queried tournament and user's teamSource. Available to Scouting Leads.
 * Non-averaged results default to highest report, except in the case of robot roles (to coincide with getTeamCSV).
 */
export const getTeamMatchCSV = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    if (req.user.role !== UserRole.SCOUTING_LEAD) {
      res.status(403).send("Not authorized to download scouting data");
      return;
    }

    // Source data from queried tournament
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

    // Select instances of TeamMatchData with unique combinations of team and match
    // These instances will be sorted by team and match and then looped through and aggregated
    const datapoints = await prismaClient.teamMatchData.findMany({
      where: {
        tournamentKey: params.data.tournamentKey,
      },
      select: {
        matchType: true,
        matchNumber: true,
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
            scouter: {
              select: {
                sourceTeamNumber: true,
                name: true,
              },
            },
          },
        },
      },
      // Ordering prioritizes top to bottom
      orderBy: [
        { matchType: "desc" },
        { matchNumber: "asc" },
        { teamNumber: "asc" },
      ],
    });

    if (datapoints.length === 0) {
      res.status(400).send("Not enough scouting data from provided sources");
      return;
    }

    // Group reports by match, then team number (match first for ordering purposes)
    const groupedByMatch = datapoints.reduce<Record<string, PointsReport[][]>>(
      (acc, cur) => {
        acc[cur.matchType.at(0) + cur.matchNumber] ||= [];
        acc[cur.matchType.at(0) + cur.matchNumber][cur.teamNumber] =
          cur.scoutReports;
        return acc;
      },
      {},
    );

    // Here comes the mouthful
    const aggregatedData: Omit<CondensedReport, "notes">[] = [];
    for (const [match, teams] of Object.entries(groupedByMatch)) {
      teams.forEach((reports, teamNumber) => {
        // Iterate through all TMD
        if (reports.length === 0) {
          // Push empty row if there are no reports available
          aggregatedData.push({
            ...(new Object() as Omit<CondensedReport, "notes">),
            match: match,
            teamNumber: teamNumber,
          });
        } else {
          // Append names of scouters from the same team as the user
          const scouterNames = reports
            .filter((e) => e.scouter.sourceTeamNumber === req.user.teamNumber)
            .map((e) => e.scouter.name.replace(/,/g, ";")); // Avoid commas in a csv...
          aggregatedData.push(
            aggregateTeamMatchReports(
              match,
              teamNumber,
              reports,
              scouterNames,
              includeAuto,
              includeTeleop,
            ),
          );
        }
      });
    }

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

function aggregateTeamMatchReports(
  match: string,
  teamNumber: number,
  reports: Omit<PointsReport, "scouter">[],
  scouters: string[],
  includeAuto: boolean,
  includeTeleop: boolean,
): Omit<CondensedReport, "notes"> {
  const data: Omit<CondensedReport, "notes"> = {
    match: match,
    teamNumber: teamNumber,
    role: null,
    coralPickup: null,
    algaePickup: null,
    algaeKnocking: false,
    underShallowCage: false,
    teleopPoints: 0,
    autoPoints: 0,
    driverAbility: 0,
    feeds: 0,
    defends: 0,
    coralPickups: 0,
    algaePickups: 0,
    coralDrops: 0,
    algaeDrops: 0,
    coralL1: 0,
    coralL2: 0,
    coralL3: 0,
    coralL4: 0,
    processorScores: 0,
    netScores: 0,
    netFails: 0,
    activeAuton: false,
    endgame: null,
    scouter: scouters.join(","),
  };

  // Out of scope iteration variables
  const roleCount: Record<RobotRole, number> = {
    OFFENSE: 0,
    DEFENSE: 0,
    FEEDER: 0,
    IMMOBILE: 0,
  };
  const endgameCount: Record<BargeResult, number> = {
    DEEP: 0,
    SHALLOW: 0,
    FAILED_DEEP: 0,
    FAILED_SHALLOW: 0,
    PARKED: 0,
    NOT_ATTEMPTED: 0,
  };
  let coral: CoralPickup = CoralPickup.NONE;
  let algae: AlgaePickup = AlgaePickup.NONE;

  reports.forEach((report) => {
    data.driverAbility += report.driverAbility;
    roleCount[report.robotRole]++;
    endgameCount[report.bargeResult]++;

    // Set discrete robot capabilities
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

    // Sum match points and actions
    report.events.forEach((event) => {
      if (event.time <= autoEnd) {
        data.autoPoints += event.points;
      } else {
        data.teleopPoints += event.points;
      }

      switch (event.action) {
        case EventAction.PICKUP_CORAL:
          data.coralPickups++;
          break;
        case EventAction.PICKUP_ALGAE:
          data.algaePickups++;
          break;
        case EventAction.FEED:
          data.feeds++;
          break;
        case EventAction.AUTO_LEAVE:
          data.activeAuton = true;
          break;
        case EventAction.DEFEND:
          data.defends++;
          break;
        case EventAction.SCORE_NET:
          data.netScores++;
          break;
        case EventAction.FAIL_NET:
          data.netFails++;
          break;
        case EventAction.SCORE_PROCESSOR:
          data.processorScores++;
          break;
        case EventAction.SCORE_CORAL:
          switch (event.position) {
            case Position.LEVEL_ONE:
              data.coralL1++;
              break;
            case Position.LEVEL_TWO:
              data.coralL2++;
              break;
            case Position.LEVEL_THREE:
              data.coralL3++;
              break;
            case Position.LEVEL_FOUR:
              data.coralL4++;
              break;
            default:
              // During auto
              if (posL1.includes(event.position)) {
                data.coralL1++;
              } else if (posL2.includes(event.position)) {
                data.coralL2++;
              } else if (posL3.includes(event.position)) {
                data.coralL3++;
              } else {
                data.coralL4++;
              }
              break;
          }
          break;
        case EventAction.DROP_ALGAE:
          data.algaeDrops++;
          break;
        case EventAction.DROP_CORAL:
          data.coralDrops++;
          break;
      }
    });
  });

  data.coralPickup = coral;
  data.algaePickup = algae;

  // Find highest-reported robot role and endgame interaction
  Object.entries(roleCount).reduce((highest, role) => {
    // Using >= gives precedence to later keys
    if (role[1] >= highest) {
      highest = role[1];
      data.role = role[0];
    }
    return highest;
  }, 0);
  Object.entries(endgameCount).reduce((most, val) => {
    // Using > gives precedence to earlier keys
    if (val[1] > most) {
      most = val[1];
      data.endgame = val[0];
    }
    return most;
  }, 0);

  // Divide relevent sums by number of reports to get mean
  if (reports.length > 1) {
    data.teleopPoints = roundToHundredth(data.teleopPoints / reports.length);
    data.autoPoints = roundToHundredth(data.autoPoints / reports.length);
    data.driverAbility = roundToHundredth(data.driverAbility / reports.length);
    data.feeds = roundToHundredth(data.feeds / reports.length);
    data.defends = roundToHundredth(data.defends / reports.length);
    data.coralPickups = roundToHundredth(data.coralPickups / reports.length);
    data.algaePickups = roundToHundredth(data.algaePickups / reports.length);
    data.coralDrops = roundToHundredth(data.coralDrops / reports.length);
    data.algaeDrops = roundToHundredth(data.algaeDrops / reports.length);
    data.coralL1 = roundToHundredth(data.coralL1 / reports.length);
    data.coralL2 = roundToHundredth(data.coralL2 / reports.length);
    data.coralL3 = roundToHundredth(data.coralL3 / reports.length);
    data.coralL4 = roundToHundredth(data.coralL4 / reports.length);
    data.processorScores = roundToHundredth(
      data.processorScores / reports.length,
    );
    data.netScores = roundToHundredth(data.netScores / reports.length);
    data.netFails = roundToHundredth(data.netFails / reports.length);
  }

  // Add endgame points to total points
  if (includeTeleop && includeAuto) {
    data.teleopPoints += endgameToPoints[data.endgame];
  }

  return data;
}

function roundToHundredth(a: number): number {
  return Math.round(a * 100) / 100;
}
