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
  AutoClimb,
  EndgameClimb,
} from "@prisma/client";
import { autoEnd, endgameToPoints, Metric } from "../analysisConstants.js";
import { z } from "zod";
import {
  dataSourceRuleToPrismaFilter,
  dataSourceRuleSchema,
} from "../dataSourceRule.js";
import { averageScoutReport } from "../coreAnalysis/averageScoutReport.js";

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
  accuracy: number;
  outpostIntakes: number;
  outpostOuttakes: number;
  depot: number;
  groundIntakes: number;
  fuelScored: number;
  autoClimb: string;
  endgameClimb: string;
  mobility: string;
  scouter: string;
  notes: string;
}

// Simplified scouting report with properties required for aggregation
interface PointsReport {
  notes: string;
  robotRoles: RobotRole[];
  endgameClimb: EndgameClimb;
  autoClimb: AutoClimb;
  driverAbility: number;
  accuracy: number;
  events: Partial<Event>[];
  scouter: Partial<Scouter>;
  teamMatchData: Partial<TeamMatchData>;
  uuid?: string;
}

/**
 * Sends csv file of rows of CondensedReport instances, representing a single scout report.
 * Uses data from queried tournament and user's teamSource. Available to Scouting Leads.
 */
export const getReportCSV = async (
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

    // Select scout reports from the given tournament and team sources
    // These instances will be looped through and remade into rows of the csv
    const datapoints = await prismaClient.scoutReport.findMany({
      where: {
        teamMatchData: {
          tournamentKey: params.data.tournamentKey,
        },
        scouter: {
          sourceTeamNumber: dataSourceRuleToPrismaFilter(
            dataSourceRuleSchema(z.number()).parse(req.user.teamSourceRule),
          ),
        },
      },
      select: {
        uuid: true,
        notes: true,
        robotRoles: true,
        endgameClimb: true,
        autoClimb: true,
        driverAbility: true,
        accuracy: true,
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

    const condensed = await Promise.all(
      datapoints.map(async (r) =>
        condenseReport(
          {
            uuid: r.uuid,
            notes: r.notes,
             robotRoles: r.robotRoles,
            endgameClimb: r.endgameClimb,
            autoClimb: r.autoClimb,
            driverAbility: r.driverAbility,
            accuracy: r.accuracy,
            events: r.events,
            scouter: r.scouter,
            teamMatchData: r.teamMatchData,
          },
          req.user.teamNumber,
          includeAuto,
          includeTeleop,
        ),
      ),
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

async function condenseReport(
  report: PointsReport,
  userTeam: number,
  includeAuto: boolean,
  includeTeleop: boolean,
): Promise<CondensedReport> {
  const data: CondensedReport = {
    match:
      report.teamMatchData.matchType.at(0) + report.teamMatchData.matchNumber,
    teamNumber: report.teamMatchData.teamNumber,
    role: (report.robotRoles && report.robotRoles[0]) || RobotRole.CYCLING,
    totalPoints: 0,
    feedsFromNeutral: 0,
    feedsFromOpponent: 0,
    campDefends: 0,
    blockDefends: 0,
    accuracy: report.accuracy,
    autoClimb: report.autoClimb,
    mobility: "N/A",
    outpostIntakes: 0,
    outpostOuttakes: 0,
    fuelScored: 0,
    depot: 0,
    groundIntakes: 0,
    teleopPoints: 0,
    autoPoints: 0,
    driverAbility: report.driverAbility,
    endgameClimb: report.endgameClimb,
    scouter: "",
    notes: report.notes.replace(/,/g, ";"),
  };

  // Compute points using events
  report.events.forEach((event) => {
    if (event.time <= autoEnd) {
      data.autoPoints += event.points;
    } else {
      data.teleopPoints += event.points;
    }
    if (event.action === EventAction.START_FEEDING && event.position === Position.NEUTRAL_ZONE) {
      data.feedsFromNeutral += 1;
    }
  });

  // Add stage points to total points
  if (includeTeleop && includeAuto) {
    data.teleopPoints += endgameToPoints[data.endgameClimb as EndgameClimb];
  }

  // Use averageScoutReport for single-report metrics
  if (report.uuid) {
    const metrics = [
      Metric.totalPoints,
      Metric.contactDefenseTime,
      Metric.campingDefenseTime,
      Metric.totalDefenseTime,
      Metric.fuelPerSecond,
      Metric.feedingRate,
      Metric.feedsPerMatch,
      Metric.outpostIntakes,
    ];
    const agg = await averageScoutReport({} as any, {
      scoutReportUuid: report.uuid,
      metrics,
    });
    data.totalPoints = agg[Metric.totalPoints] ?? data.teleopPoints + data.autoPoints;
    // Map some derived counts
    data.blockDefends = Math.round((agg[Metric.contactDefenseTime] ?? 0) / 1); // seconds proxy
    data.campDefends = Math.round((agg[Metric.campingDefenseTime] ?? 0) / 1);
    data.outpostIntakes = Math.round(agg[Metric.outpostIntakes] ?? 0);
    data.fuelScored = Math.round((agg[Metric.fuelPerSecond] ?? 0) * 150);
  }

  if (report.scouter.sourceTeamNumber === userTeam) {
    data.scouter = report.scouter.name.replace(/,/g, ";");
  }

  return data;
}
