import {
  AutoClimbResult,
  BeachedStatus,
  EndgameClimbResult,
  EventAction,
  FeederType,
  Position,
  FieldTraversal,
  RobotRole,
  User,
  IntakeType,
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
  robotRole,
  fieldTraversal,
  climbResult,
  beached,
  scoresWhileMoving,
  autoClimb,
  feederType,
  disrupts,
  intakeType,
}

// Ranking metrics
const metricsCategory: Metric[] = [Metric.totalPoints];

// To differentiate auton and teleop events, benefit of the doubt given to auto
const autoEnd = 18;

const specificMatchPageMetrics = [];

// Easy point calculation
const endgameToPoints: Record<EndgameClimbResult, number> = {
  [EndgameClimbResult.NOT_ATTEMPTED]: 0,
  [EndgameClimbResult.FAILED]: 0,
  [EndgameClimbResult.LEVEL_ONE]: 10,
  [EndgameClimbResult.LEVEL_TWO]: 20,
  [EndgameClimbResult.LEVEL_THREE]: 30,
};

// Metrics that are analyzed by event count
const metricToEvent: Partial<Record<Metric, EventAction>> = {
  [Metric.feedsPerMatch]: EventAction.START_FEEDING,
  [Metric.volleysPerMatch]: EventAction.START_SCORING,
};

const FlippedRoleMap: Record<RobotRole, number> = {
  [RobotRole.CYCLING]: 0,
  [RobotRole.STEALING]: 1,
  [RobotRole.SCORING]: 2,
  [RobotRole.FEEDING]: 3,
  [RobotRole.DEFENDING]: 4,
  [RobotRole.IMMOBILE]: 5,
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
  [Position.FIRST_RUNG]: 8,
  [Position.SECOND_RUNG]: 9,
  [Position.THIRD_RUNG]: 10,
  [Position.START_A]: 11,
  [Position.START_B]: 12,
  [Position.START_C]: 13,
  [Position.START_D]: 14,
  [Position.START_E]: 15,
};

const breakdownPos = "True";
const breakdownNeg = "False";

const lowercaseToBreakdown: Record<string, MetricsBreakdown> = {
  robotrole: MetricsBreakdown.robotRole,
  fieldtraversal: MetricsBreakdown.fieldTraversal,
  beached: MetricsBreakdown.beached,
  autoclimb: MetricsBreakdown.autoClimb,
  climbresult: MetricsBreakdown.climbResult,
  feedertype: MetricsBreakdown.feederType,
  scoreswhilemoving: MetricsBreakdown.scoresWhileMoving,
  disrupts: MetricsBreakdown.disrupts,
  intaketype: MetricsBreakdown.intakeType,
};

const breakdownToEnum: Record<MetricsBreakdown, string[]> = {
  [MetricsBreakdown.robotRole]: [...Object.values(RobotRole)],
  [MetricsBreakdown.fieldTraversal]: [...Object.values(FieldTraversal)],
  [MetricsBreakdown.beached]: [...Object.values(BeachedStatus)],
  [MetricsBreakdown.autoClimb]: [...Object.values(AutoClimbResult)],
  [MetricsBreakdown.climbResult]: [...Object.values(EndgameClimbResult)],
  [MetricsBreakdown.feederType]: [...Object.values(FeederType)],
  [MetricsBreakdown.scoresWhileMoving]: [breakdownNeg, breakdownPos],
  [MetricsBreakdown.disrupts]: [breakdownNeg, breakdownPos],
  [MetricsBreakdown.intakeType]: [...Object.values(IntakeType)],
};

const metricsToNumber: Record<string, number> = {
  totalPoints: 0,
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
  totalpoints: Metric.totalPoints,
  autopoints: Metric.autoPoints,
  teleoppoints: Metric.teleopPoints,
  driverability: Metric.driverAbility,
  defensiveeffectiveness: Metric.defenseEffectiveness,
  accuracy: Metric.accuracy,
  fuelpersecond: Metric.fuelPerSecond,
  volleyspermatch: Metric.volleysPerMatch,
  feedingrate: Metric.feedingRate,
  feedspermatch: Metric.feedsPerMatch,
  totalfueloutputted: Metric.totalFuelOutputted,
  outpostintakes: Metric.outpostIntakes,
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
