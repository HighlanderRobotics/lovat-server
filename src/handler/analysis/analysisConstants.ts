import {
  AutoClimb,
  EndgameClimb,
  EventAction,
  FeederType,
  Position,
  RobotRole,
  User,
  IntakeType,
  Mobility,
  Beached,
} from "@prisma/client";
import prismaClient from "../../prismaClient.js";
import { DataSourceRule } from "./dataSourceRule.js";
//add cooperation

// Tunable constants
const defaultSTD = 0.1;
const defaultEndgamePoints = 1.5;

// General numeric metrics
enum Metric {
  totalPoints,
  autoPoints,
  teleopPoints,
  fuelPerSecond,
  accuracy,
  volleysPerMatch,
  l1StartTime,
  l2StartTime,
  l3StartTime,
  autoClimbStartTime,
  driverAbility,
  contactDefenseTime,
  defenseEffectiveness,
  campingDefenseTime,
  totalDefenseTime,
  timeFeeding,
  feedingRate,
  feedsPerMatch,
  totalFuelOutputted,
  outpostIntakes,
}

// !!!IMPORTANT!!! toString() must return a property of ScoutReport
// Metrics for discrete ScoutReport fields
enum MetricsBreakdown {
  robotRole = "robotRole",
  mobility = "mobility",
  endgameClimb = "endgameClimb",
  beached = "beached",
  scoresWhileMoving = "scoresWhileMoving",
  disrupts = "disrupts",
  autoClimb = "autoClimb",
  feederType = "feederType",
  intakeType = "intakeType",
}

// Ranking metrics
const metricsCategory: Metric[] = [
  Metric.totalPoints,
  Metric.autoPoints,
  Metric.teleopPoints,
  Metric.fuelPerSecond,
  Metric.accuracy,
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
  Metric.outpostIntakes,
];

// To differentiate auton and teleop events, benefit of the doubt given to auto
const autoEnd = 18;

const specificMatchPageMetrics = [];

// Easy point calculation
const endgameToPoints: Record<EndgameClimb, number> = {
  [EndgameClimb.NOT_ATTEMPTED]: 0,
  [EndgameClimb.FAILED]: 0,
  [EndgameClimb.L1]: 10,
  [EndgameClimb.L2]: 20,
  [EndgameClimb.L3]: 30,
};

// Metrics that are analyzed by event count
const metricToEvent: Partial<Record<Metric, EventAction>> = {
  [Metric.feedsPerMatch]: EventAction.START_FEEDING,
  [Metric.volleysPerMatch]: EventAction.START_SCORING,
};

const FlippedRoleMap: Record<RobotRole, number> = {
  [RobotRole.CYCLING]: 0,
  [RobotRole.SCORING]: 1,
  [RobotRole.FEEDING]: 2,
  [RobotRole.DEFENDING]: 3,
  [RobotRole.IMMOBILE]: 4,
};

const FlippedActionMap: Record<EventAction, number> = {
  [EventAction.START_SCORING]: 0,
  [EventAction.STOP_SCORING]: 1,
  [EventAction.START_MATCH]: 2,
  [EventAction.START_CAMPING]: 3,
  [EventAction.STOP_CAMPING]: 4,
  [EventAction.START_DEFENDING]: 5,
  [EventAction.STOP_DEFENDING]: 6,
  [EventAction.INTAKE]: 7,
  [EventAction.OUTTAKE]: 8,
  [EventAction.DISRUPT]: 9,
  [EventAction.CROSS]: 10,
  [EventAction.CLIMB]: 11,
  [EventAction.START_FEEDING]: 12,
  [EventAction.STOP_FEEDING]: 13,
};

const FlippedPositionMap: Record<Position, number> = {
  [Position.LEFT_TRENCH]: 0,
  [Position.LEFT_BUMP]: 1,
  [Position.HUB]: 2,
  [Position.RIGHT_TRENCH]: 3,
  [Position.RIGHT_BUMP]: 4,
  [Position.NEUTRAL_ZONE]: 5,
  [Position.DEPOT]: 6,
  [Position.OUTPOST]: 7,
  [Position.NONE]: 8,
};

const breakdownPos = "true";
const breakdownNeg = "false";

const lowercaseToBreakdown: Record<string, MetricsBreakdown> = {
  robotrole: MetricsBreakdown.robotRole,
  mobility: MetricsBreakdown.mobility,
  beached: MetricsBreakdown.beached,
  autoclimb: MetricsBreakdown.autoClimb,
  climbresult: MetricsBreakdown.endgameClimb,
  feedertype: MetricsBreakdown.feederType,
  scoreswhilemoving: MetricsBreakdown.scoresWhileMoving,
  disrupts: MetricsBreakdown.disrupts,
  intaketype: MetricsBreakdown.intakeType,
};

const breakdownToEnum: Record<MetricsBreakdown, string[]> = {
  [MetricsBreakdown.robotRole]: [...Object.values(RobotRole)],
  [MetricsBreakdown.mobility]: [...Object.values(Mobility)],
  [MetricsBreakdown.endgameClimb]: [...Object.values(EndgameClimb)],
  [MetricsBreakdown.beached]: [...Object.values(Beached)],
  [MetricsBreakdown.scoresWhileMoving]: [breakdownNeg, breakdownPos],
  [MetricsBreakdown.autoClimb]: [...Object.values(AutoClimb)],
  [MetricsBreakdown.feederType]: [...Object.values(FeederType)],
  [MetricsBreakdown.intakeType]: [...Object.values(IntakeType)],
  [MetricsBreakdown.disrupts]: [breakdownNeg, breakdownPos],
};

const metricsToNumber: Record<string, number> = {
  totalPoints: 0,
  autoPoints: 1,
  teleopPoints: 2,
  fuelPerSecond: 3,
  accuracy: 4,
  volleysPerMatch: 5,
  l1StartTime: 6,
  l2StartTime: 7,
  l3StartTime: 8,
  autoClimbStartTime: 9,
  driverAbility: 10,
  contactDefenseTime: 11,
  defenseEffectiveness: 12,
  campingDefenseTime: 13,
  totalDefenseTime: 14,
  timeFeeding: 15,
  feedingRate: 16,
  feedsPerMatch: 17,
  totalFuelOutputted: 18,
  outpostIntakes: 19,
};

const metricToName: Record<Metric, string> = {
  [Metric.totalPoints]: "totalPoints",
  [Metric.autoPoints]: "autoPoints",
  [Metric.teleopPoints]: "teleopPoints",
  [Metric.fuelPerSecond]: "fuelPerSecond",
  [Metric.accuracy]: "accuracy",
  [Metric.volleysPerMatch]: "volleysPerMatch",
  [Metric.l1StartTime]: "l1StartTime",
  [Metric.l2StartTime]: "l2StartTime",
  [Metric.l3StartTime]: "l3StartTime",
  [Metric.autoClimbStartTime]: "autoClimbStartTime",
  [Metric.driverAbility]: "driverAbility",
  [Metric.contactDefenseTime]: "contactDefenseTime",
  [Metric.defenseEffectiveness]: "defenseEffectiveness",
  [Metric.campingDefenseTime]: "campingDefenseTime",
  [Metric.totalDefenseTime]: "totalDefenseTime",
  [Metric.timeFeeding]: "timeFeeding",
  [Metric.feedingRate]: "feedingRate",
  [Metric.feedsPerMatch]: "feedsPerMatch",
  [Metric.totalFuelOutputted]: "totalFuelOutputted",
  [Metric.outpostIntakes]: "outpostIntakes",
};

// Translates between picklist parameters and metric enum
const picklistToMetric: Record<string, Metric> = {
  totalPoints: Metric.totalPoints,
  autoPoints: Metric.autoPoints,
  teleopPoints: Metric.teleopPoints,
  autoClimb: Metric.autoClimbStartTime,
  defenseEffectiveness: Metric.defenseEffectiveness,
  contactDefenseTime: Metric.contactDefenseTime,
  campingDefenseTime: Metric.campingDefenseTime,
  totalDefensiveTime: Metric.totalDefenseTime,
  totalFuelThroughput: Metric.totalFuelOutputted,
  feedingRate: Metric.feedingRate,
  scoringRate: Metric.fuelPerSecond,
};

// For occasional query optimizations
const tournamentLowerBound = 497;
const teamLowerBound = 3300; // Total 3468 as of 2024 season

// For large database requests
const swrConstant = 300;
const ttlConstant = 200;

// Caching this for later
const allTeamNumbers = (async () => {
  return (await prismaClient.team.findMany()).map((team) => team.number);
})();
const allTournaments = (async () => {
  return (
    await prismaClient.tournament.findMany({
      orderBy: [
        { date: "asc" }, // Most recent last
      ],
    })
  ).map((tnmt) => tnmt.key);
})();

const multiplerBaseAnalysis = 4;
export {
  defaultEndgamePoints,
  defaultSTD,
  Metric,
  metricsCategory,
  autoEnd,
  specificMatchPageMetrics,
  MetricsBreakdown,
  multiplerBaseAnalysis,
  endgameToPoints,
  metricToEvent,
  FlippedPositionMap,
  FlippedActionMap,
  FlippedRoleMap,
  metricToName,
  picklistToMetric,
  tournamentLowerBound,
  teamLowerBound,
  swrConstant,
  ttlConstant,
  metricsToNumber,
  allTeamNumbers,
  allTournaments,
  lowercaseToBreakdown,
  breakdownPos,
  breakdownNeg,
  breakdownToEnum,
};

export type AnalysisContext = {
  user: User;
  dataSource?: {
    teams: DataSourceRule<number>;
    tournaments: DataSourceRule<string>;
  };
};
