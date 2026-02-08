import { Response } from "express";
import prismaClient from "../../../prismaClient.js";
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth.js";
import { stringify } from "csv-stringify/sync";
import {
  Scouter,
  TeamMatchData,
  Event,
  RobotRole,
  AutoClimb,
  EndgameClimb,
  Beached,
  Mobility,
  ClimbPosition,
  ClimbSide,
  FeederType,
  IntakeType,
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
  totalPoints: number;
  teleopPoints: number;
  autoPoints: number;
  driverAbility: number;
  fuelPerSecond: number;
  accuracy: number;
  volleysPerMatch: number;
  l1StartTime: number;
  l2StartTime: number;
  l3StartTime: number;
  autoClimbStartTime: number;
  contactDefenseTime: number;
  defenseEffectiveness: number;
  campingDefenseTime: number;
  totalDefenseTime: number;
  timeFeeding: number;
  feedingRate: number;
  feedsPerMatch: number;
  totalFuelOutputted: number;
  totalBallThroughput: number;
  totalBallsFed: number;
  outpostIntakes: number;
  robotRoles: string;
  mobility: string;
  endgameClimb: string;
  beached: string;
  scoresWhileMoving: boolean;
  disrupts: boolean;
  autoClimb: string;
  feederTypes: string;
  intakeType: string;
  scouter: string;
  notes: string;
}

// Simplified scouting report with properties required for aggregation
interface PointsReport {
  notes: string;
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

    // Select scout reports from the given tournament and team sources
    // These instances will be looped through and remade into rows of the csv
    const where: any = {
      teamMatchData: {
        tournamentKey: params.data.tournamentKey,
      },
    };
    const parsedRule = dataSourceRuleSchema(z.number()).safeParse(
      req.user?.teamSourceRule,
    );
    if (parsedRule.success) {
      const filter = dataSourceRuleToPrismaFilter(parsedRule.data);
      if (filter) {
        where.scouter = { sourceTeamNumber: filter };
      }
    }

    const datapoints = await prismaClient.scoutReport.findMany({
      where,
      select: {
        uuid: true,
        notes: true,
        robotRoles: true,
        endgameClimb: true,
        autoClimb: true,
        driverAbility: true,
        accuracy: true,
        defenseEffectiveness: true,
        climbPosition: true,
        climbSide: true,
        mobility: true,
        beached: true,
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
              quantity: true,
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
            defenseEffectiveness: r.defenseEffectiveness,
            events: r.events,
            scouter: r.scouter,
            teamMatchData: r.teamMatchData,
            climbPosition: r.climbPosition,
            climbSide: r.climbSide,
            mobility: r.mobility,
            beached: r.beached,
            scoresWhileMoving: r.scoresWhileMoving,
            disrupts: r.disrupts,
            feederTypes: r.feederTypes,
            intakeType: r.intakeType,
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
      columns: condensed.length ? Object.keys(condensed[0]) : [],
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
      String(report.teamMatchData.matchType?.at(0) ?? "") + String(report.teamMatchData.matchNumber ?? ""),
    teamNumber: report.teamMatchData.teamNumber ?? 0,
    totalPoints: 0,
    accuracy: report.accuracy ?? 0,
    autoClimb: String(report.autoClimb ?? ""),
    fuelPerSecond: 0,
    volleysPerMatch: 0,
    l1StartTime: 0,
    l2StartTime: 0,
    l3StartTime: 0,
    autoClimbStartTime: 0,
    driverAbility: report.driverAbility ?? 0,
    contactDefenseTime: 0,
    defenseEffectiveness: report.defenseEffectiveness ?? 0,
    campingDefenseTime: 0,
    totalDefenseTime: 0,
    timeFeeding: 0,
    feedingRate: 0,
    feedsPerMatch: 0,
    totalFuelOutputted: 0,
    totalBallsFed: 0,
    totalBallThroughput: 0,
    outpostIntakes: 0,
    robotRoles: (report.robotRoles || []).join(","),
    beached: String(report.beached ?? ""),
    scoresWhileMoving: Boolean(report.scoresWhileMoving),
    disrupts: Boolean(report.disrupts),
    endgameClimb: String(report.endgameClimb ?? ""),
    feederTypes: (report.feederTypes || []).join(","),
    intakeType: String(report.intakeType ?? ""),
    mobility: String(report.mobility ?? "N/A"),
    teleopPoints: 0,
    autoPoints: 0,
    scouter: "",
    notes: String(report.notes ?? "").replace(/,/g, ";"),
  };

  // Compute points using events (respects includeAuto/includeTeleop time filter)
  (report.events || []).forEach((event) => {
    const t = Number(event.time ?? 0);
    const pts = Number(event.points ?? 0);
    if (t <= autoEnd) {
      data.autoPoints += pts;
    } else {
      data.teleopPoints += pts;
    }
  });

  // Add stage points to total points when exporting full match
  if (includeTeleop && includeAuto) {
    const climb = report.endgameClimb;
    data.teleopPoints += climb ? endgameToPoints[climb] : 0;
  }

  // Use averageScoutReport to populate computed metrics for this single report
  if (report.uuid) {
    const metrics = [
      Metric.totalPoints,
      Metric.autoPoints,
      Metric.teleopPoints,
      Metric.fuelPerSecond,
      Metric.volleysPerMatch,
      Metric.l1StartTime,
      Metric.l2StartTime,
      Metric.l3StartTime,
      Metric.autoClimbStartTime,
      Metric.driverAbility,
      Metric.contactDefenseTime,
      Metric.defenseEffectiveness,
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
    const agg = await averageScoutReport({} as any, {
      scoutReportUuid: report.uuid,
      metrics,
    });

    const val = (m: Metric) => (agg as Record<string, number>)[m];

    // Populate numeric metrics if available
    const maybeSet = (m: Metric, setter: (n: number) => void) => {
      const n = val(m);
      if (typeof n === "number" && Number.isFinite(n)) setter(n);
    };

    // totalPoints from analysis, otherwise derived from segment sums
    const total = val(Metric.totalPoints);
    data.totalPoints =
      typeof total === "number" && Number.isFinite(total)
        ? total
        : data.teleopPoints + data.autoPoints;

    maybeSet(Metric.fuelPerSecond, (n) => (data.fuelPerSecond = n));
    maybeSet(Metric.volleysPerMatch, (n) => (data.volleysPerMatch = n));
    maybeSet(Metric.l1StartTime, (n) => (data.l1StartTime = n));
    maybeSet(Metric.l2StartTime, (n) => (data.l2StartTime = n));
    maybeSet(Metric.l3StartTime, (n) => (data.l3StartTime = n));
    maybeSet(Metric.autoClimbStartTime, (n) => (data.autoClimbStartTime = n));
    maybeSet(Metric.driverAbility, (n) => (data.driverAbility = n));
    maybeSet(Metric.contactDefenseTime, (n) => (data.contactDefenseTime = n));
    maybeSet(Metric.defenseEffectiveness, (n) => (data.defenseEffectiveness = n));
    maybeSet(Metric.campingDefenseTime, (n) => (data.campingDefenseTime = n));
    maybeSet(Metric.totalDefenseTime, (n) => (data.totalDefenseTime = n));
    maybeSet(Metric.timeFeeding, (n) => (data.timeFeeding = n));
    maybeSet(Metric.feedingRate, (n) => (data.feedingRate = n));
    maybeSet(Metric.feedsPerMatch, (n) => (data.feedsPerMatch = n));
    maybeSet(Metric.totalFuelOutputted, (n) => (data.totalFuelOutputted = n));
    maybeSet(Metric.totalBallsFed, (n) => (data.totalBallsFed = n));
    maybeSet(Metric.totalBallThroughput, (n) => (data.totalBallThroughput = n));
    maybeSet(Metric.outpostIntakes, (n) => (data.outpostIntakes = n));

    // Keep per-segment points computed from filtered events
    // Do not overwrite autoPoints/teleopPoints to respect includeAuto/includeTeleop
  }

  if (report.scouter?.sourceTeamNumber === userTeam && report.scouter?.name) {
    data.scouter = String(report.scouter.name).replace(/,/g, ";");
  }

  return data;
}
