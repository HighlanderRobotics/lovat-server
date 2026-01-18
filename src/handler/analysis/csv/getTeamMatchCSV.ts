import { Response } from "express";
import prismaClient from "../../../prismaClient.js";
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth.js";
import { stringify } from "csv-stringify/sync";
import {
  UserRole,
  RobotRole,
  EventAction,
  Position,
  Scouter,
  Event,
  Mobility,
  AutoClimb,
  EndgameClimb,
} from "@prisma/client";
import { autoEnd, endgameToPoints } from "../analysisConstants.js";
import { z } from "zod";
import { CondensedReport } from "./getReportCSV.js";
import {
  dataSourceRuleToPrismaFilter,
  dataSourceRuleSchema,
} from "../dataSourceRule.js";

// Simplified scouting report with properties required for aggregation
interface PointsReport {
  robotRole: RobotRole;
  mobility: Mobility;
  endgameClimb: EndgameClimb;
  autoClimb: AutoClimb;
  driverAbility: number;
  accuracy: number;
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
            endgameClimb: true,
            autoClimb: true,
            mobility: true,
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
    teleopPoints: 0,
    autoPoints: 0,
    driverAbility: 0,
    feedsFromNeutral: 0,
    feedsFromOpponent: 0,
    totalPoints: 0,
    campDefends: 0,
    blockDefends: 0,
    accuracy: 0,
    outpostIntakes: 0,
    outpostOuttakes: 0,
    depot: 0,
    groundIntakes: 0,
    fuelScored: 0,
    autoClimb: null,
    endgameClimb: null,
    mobility: null,
    scouter: scouters.join(","),
  };

  // Out of scope iteration variables
  const roleCount: Record<RobotRole, number> = {
    FEEDING: 0,
    DEFENDING: 0,
    SCORING: 0,
    CYCLING: 0,
    IMMOBILE: 0,
  };
  const endgameCount: Record<EndgameClimb, number> = {
    L1: 0,
    L2: 0,
    L3: 0,
    FAILED: 0,
    NOT_ATTEMPTED: 0,
  };

  reports.forEach((report) => {
    data.driverAbility += report.driverAbility;
    roleCount[report.robotRole]++;
    endgameCount[report.endgameClimb]++;

    switch (report.mobility) {
      case Mobility.BUMP:
        data.mobility =
          data.mobility === Mobility.TRENCH ? Mobility.BOTH : Mobility.BUMP;
        break;
      case Mobility.TRENCH:
        data.mobility =
          data.mobility === Mobility.BUMP ? Mobility.BOTH : Mobility.TRENCH;
        break;
      case Mobility.BOTH:
        data.mobility = Mobility.BOTH;
        break;
    }

    data.accuracy += report.accuracy;

    // Sum match points and actions
    report.events.forEach((event) => {
      if (event.time <= autoEnd) {
        data.autoPoints += event.points;
      } else {
        data.teleopPoints += event.points;
      }

      switch (event.action) {
        case EventAction.START_SCORING:
          data.fuelScored += 1;
          break;
      }
    });
  });

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
      data.endgameClimb = val[0];
    }
    return most;
  }, 0);

  // Divide relevent sums by number of reports to get mean
  if (reports.length > 1) {
    data.teleopPoints = roundToHundredth(data.teleopPoints / reports.length);
    data.autoPoints = roundToHundredth(data.autoPoints / reports.length);
    data.driverAbility = roundToHundredth(data.driverAbility / reports.length);
    data.accuracy = roundToHundredth(data.accuracy / reports.length);
    data.feedsFromNeutral = roundToHundredth(
      data.feedsFromNeutral / reports.length,
    );
    data.feedsFromOpponent = roundToHundredth(
      data.feedsFromOpponent / reports.length,
    );
    data.outpostIntakes = roundToHundredth(
      data.outpostIntakes / reports.length,
    );
    data.outpostOuttakes = roundToHundredth(
      data.outpostOuttakes / reports.length,
    );
    data.depot = roundToHundredth(data.depot / reports.length);
    data.groundIntakes = roundToHundredth(data.groundIntakes / reports.length);
    data.fuelScored = roundToHundredth(data.fuelScored / reports.length);
  }

  // Add endgame points to total points
  if (includeTeleop && includeAuto) {
    data.teleopPoints += endgameToPoints[data.endgameClimb];
  }

  return data;
}

function roundToHundredth(a: number): number {
  return Math.round(a * 100) / 100;
}
