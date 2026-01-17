import { Response } from "express";
import prismaClient from "../../../prismaClient.js";
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth.js";
import { stringify } from "csv-stringify/sync";
import {
  UserRole,
  EventAction,
  Position,
  Scouter,
  TeamMatchData,
  Event,
  RobotRole,
  AutoClimbResult,
  EndgameClimbResult,
  FieldTraversal,
} from "@prisma/client";
import { autoEnd, endgameToPoints } from "../analysisConstants.js";
import { z } from "zod";
import {
  dataSourceRuleToPrismaFilter,
  dataSourceRuleSchema,
} from "../dataSourceRule.js";

// Scouting report condensed into a single dimension that can be pushed to a row in the csv
export interface CondensedReport {
  match: string;
  teamNumber: number;
  role: string;
  teleopPoints: number;
  autoPoints: number;
  driverAbility: number;
  feedsFromNeutral: number;
  feedsFromOpponent: number;
  totalPoints: number;
  campDefends: number;
  blockDefends: number;
  shootingAccuracy: number;
  outpostIntakes: number;
  outpostOuttakes: number;
  depot: number;
  groundIntakes: number;
  fuelScored: number;
  autoClimbResult: string;
  endgameClimbResult: string;
  fieldTraversal: string;
  scouter: string;
  notes: string;
}

// Simplified scouting report with properties required for aggregation
interface PointsReport {
  notes: string;
  robotRole: RobotRole;
  endgameClimbResult: EndgameClimbResult;
  autoClimbResult: AutoClimbResult;
  fieldTraversal: FieldTraversal;
  driverAbility: number;
  shootingAccuracy: number;
  events: Partial<Event>[];
  scouter: Partial<Scouter>;
  teamMatchData: Partial<TeamMatchData>;
}

/**
 * Sends csv file of rows of CondensedReport instances, representing a single scout report.
 * Uses data from queried tournament and user's teamSource. Available to Scouting Leads.
 */
export const getReportCSV = async (
  req: AuthenticatedRequest,
  res: Response
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

    // Select scout reports from the given tournament and team sources
    // These instances will be looped through and remade into rows of the csv
    const datapoints = await prismaClient.scoutReport.findMany({
      where: {
        teamMatchData: {
          tournamentKey: params.data.tournamentKey,
        },
        scouter: {
          sourceTeamNumber: dataSourceRuleToPrismaFilter(
            dataSourceRuleSchema(z.number()).parse(req.user.teamSourceRule)
          ),
        },
      },
      select: {
        notes: true,
        robotRole: true,
        endgameClimbResult: true,
        autoClimbResult: true,
        fieldTraversal: true,
        driverAbility: true,
        shootingAccuracy: true,
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
        teamMatchData: {
          select: {
            teamNumber: true,
            matchNumber: true,
            matchType: true,
          },
        },
      },
      // Ordering prioritizes top to bottom
      orderBy: [
        { teamMatchData: { matchType: "desc" } },
        { teamMatchData: { matchNumber: "asc" } },
        { teamMatchData: { teamNumber: "asc" } },
      ],
    });

    if (datapoints.length === 0) {
      res.status(400).send("Not enough scouting data from provided sources");
      return;
    }

    const condensed = datapoints.map((r) =>
      condenseReport(r, req.user.teamNumber, includeAuto, includeTeleop)
    );

    // Create and send the csv string through express
    const csvString = stringify(condensed, {
      header: true,
      // Creates column headers from data properties
      columns: Object.keys(condensed[0]),
      // Required for excel viewing
      bom: true,
      // Rename boolean values to TRUE and FALSE
      cast: {
        boolean: (b) => (b ? "TRUE" : "FALSE"),
      },
      // Turn off quotation marks
      quote: false,
    });

    res.attachment("lovatReportsDownload.csv");
    res.header("Content-Type", "text/csv");
    res.send(csvString);
    return;
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};

function condenseReport(
  report: PointsReport,
  userTeam: number,
  includeAuto: boolean,
  includeTeleop: boolean
): CondensedReport {
  const data: CondensedReport = {
    match:
      report.teamMatchData.matchType.at(0) + report.teamMatchData.matchNumber,
    teamNumber: report.teamMatchData.teamNumber,
    role: report.robotRole,
    totalPoints: 0,
    feedsFromNeutral: 0,
    feedsFromOpponent: 0,
    campDefends: 0,
    blockDefends: 0,
    shootingAccuracy: report.shootingAccuracy,
    autoClimbResult: report.autoClimbResult,
    fieldTraversal: report.fieldTraversal,
    outpostIntakes: 0,
    outpostOuttakes: 0,
    fuelScored: 0,
    depot: 0,
    groundIntakes: 0,
    teleopPoints: 0,
    autoPoints: 0,
    driverAbility: report.driverAbility,
    endgameClimbResult: report.endgameClimbResult,
    scouter: "",
    notes: report.notes.replace(/,/g, ";"), // Avoid commas in a csv...
  };

  // Sum match points and actions
  report.events.forEach((event) => {
    if (event.time <= autoEnd) {
      data.autoPoints += event.points;
    } else {
      data.teleopPoints += event.points;
    }

    switch (event.action) {
      case EventAction.START_FEEDING:
        if (event.position === Position.NEUTRAL_ZONE) {
          data.feedsFromNeutral += 1;
        } else if (event.position === Position.FIRST_RUNG) {
          data.feedsFromOpponent += 1;
        }
        break;
    }
  });

  // Add stage points to total points
  if (includeTeleop && includeAuto) {
    data.teleopPoints +=
      endgameToPoints[data.endgameClimbResult as EndgameClimbResult];
  }

  if (report.scouter.sourceTeamNumber === userTeam) {
    data.scouter = report.scouter.name.replace(/,/g, ";"); // Avoid commas in a csv...
  }

  return data;
}
