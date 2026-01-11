import {
  EventAction,
  Position,
  RobotRole,
  User,
  ClimbResult,
  OverRamp,
  UnderTrench,
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
  climbPoints,
  autoPoints,
  driverAbility,
  teleopPoints,
  feedsFromNeutral,
  feedsFromOpponent,
  campDefends,
  blockDefends,
  shootingAccuracy,
  outpostIntakes,
  outpostOuttakes,
  depot,
  groundIntakes,
  fuelScored,
}

// !!!IMPORTANT!!! toString() must return a property of ScoutReport
// Metrics for discrete ScoutReport fields
enum MetricsBreakdown {
  robotRole = "robotRole",
  underTrench = "underTrench",
  overRamp = "overRamp",
  climbResult = "climbResult",
}

// Ranking metrics
const metricsCategory: Metric[] = [
  Metric.totalPoints,
  Metric.driverAbility,
  Metric.teleopPoints,
  Metric.autoPoints,
  Metric.feedsFromNeutral,
  Metric.feedsFromOpponent,
  Metric.shootingAccuracy,
  Metric.outpostIntakes,
  Metric.outpostOuttakes,
  Metric.depot,
  Metric.groundIntakes,
  Metric.fuelScored,
];

// To differentiate auton and teleop events, benefit of the doubt given to auto
const autoEnd = 18;

const specificMatchPageMetrics = [
  Metric.feedsFromNeutral,
  Metric.feedsFromOpponent,
  Metric.shootingAccuracy,
  Metric.outpostIntakes,
  Metric.outpostOuttakes,
  Metric.depot,
  Metric.groundIntakes,
  Metric.fuelScored,
];

// Easy point calculation
const endgameToPoints: Record<ClimbResult, number> = {
  [ClimbResult.NOT_ATTEMPTED]: 0,
  [ClimbResult.LEFT_ONE]: 10,
  [ClimbResult.LEFT_TWO]: 20,
  [ClimbResult.LEFT_THREE]: 30,
  [ClimbResult.MIDDLE_ONE]: 10,
  [ClimbResult.MIDDLE_TWO]: 20,
  [ClimbResult.MIDDLE_THREE]: 30,
  [ClimbResult.RIGHT_ONE]: 10,
  [ClimbResult.RIGHT_TWO]: 20,
  [ClimbResult.RIGHT_THREE]: 30,
  [ClimbResult.BACK_ONE]: 10,
  [ClimbResult.BACK_TWO]: 20,
  [ClimbResult.BACK_THREE]: 30,
};

// Metrics that are analyzed by event count
const metricToEvent: Partial<Record<Metric, EventAction>> = {
  [Metric.feedsFromNeutral]: EventAction.FEED_NEUTRAL,
  [Metric.feedsFromOpponent]: EventAction.FEED_OPPONENT,
  [Metric.campDefends]: EventAction.DEFEND_CAMP,
  [Metric.blockDefends]: EventAction.DEFEND_BLOCK,
  [Metric.outpostIntakes]: EventAction.OUTPOST_INTAKE,
  [Metric.outpostOuttakes]: EventAction.OUTPOST_OUTTAKE,
  [Metric.depot]: EventAction.DEPOT_INTAKE,
  [Metric.groundIntakes]: EventAction.GROUND_INTAKE,
  [Metric.fuelScored]: EventAction.SCORE_FUEL,
};

const FlippedRoleMap: Record<RobotRole, number> = {
  [RobotRole.OFFENSE]: 0,
  [RobotRole.DEFENSE]: 1,
  [RobotRole.FEEDER]: 2,
  [RobotRole.IMMOBILE]: 3,
};

const FlippedActionMap: Record<EventAction, number> = {
  [EventAction.SCORE_FUEL]: 0,
  [EventAction.FEED_NEUTRAL]: 1,
  [EventAction.FEED_OPPONENT]: 2,
  [EventAction.DEFEND_CAMP]: 3,
  [EventAction.DEFEND_BLOCK]: 4,
  [EventAction.OUTPOST_INTAKE]: 5,
  [EventAction.OUTPOST_OUTTAKE]: 6,
  [EventAction.DEPOT_INTAKE]: 7,
  [EventAction.GROUND_INTAKE]: 8,
  [EventAction.AUTO_CLIMB]: 9,
  [EventAction.START_POSITION]: 10,
};

const FlippedPositionMap: Record<Position, number> = {
  [Position.NONE]: 0,
  [Position.ALLIANCE_ZONE]: 1,
  [Position.DEPOT]: 2,
  [Position.OUTPOST]: 3,
  [Position.TOWER]: 4,
  [Position.NEUTRAL_ZONE]: 5,
  [Position.START_A]: 6,
  [Position.START_B]: 7,
  [Position.START_C]: 8,
  [Position.START_D]: 9,
  [Position.START_E]: 10,
};

const breakdownPos = "True";
const breakdownNeg = "False";

const lowercaseToBreakdown: Record<string, MetricsBreakdown> = {
  robotrole: MetricsBreakdown.robotRole,
  undertrench: MetricsBreakdown.underTrench,
  overramp: MetricsBreakdown.overRamp,
  climbresult: MetricsBreakdown.climbResult,
};

const breakdownToEnum: Record<MetricsBreakdown, string[]> = {
  [MetricsBreakdown.robotRole]: [...Object.values(RobotRole)],
  [MetricsBreakdown.underTrench]: [...Object.values(UnderTrench)],
  [MetricsBreakdown.overRamp]: [...Object.values(OverRamp)],
  [MetricsBreakdown.climbResult]: [...Object.values(ClimbResult)],
};

const metricsToNumber: Record<string, number> = {
  totalPoints: 0,
  driverAbility: 1,
  teleopPoints: 2,
  autoPoints: 3,
  feedsFromNeutral: 4,
  feedsFromOpponent: 5,
  campDefends: 6,
  blockDefends: 7,
  shootingAccuracy: 8,
  outpostIntakes: 9,
  outpostOuttakes: 10,
  depot: 11,
  groundIntakes: 12,
  climbPoints: 13,
  fuelScored: 14,
};

const metricToName: Record<Metric, string> = {
  [Metric.totalPoints]: "totalPoints",
  [Metric.climbPoints]: "climbPoints",
  [Metric.driverAbility]: "driverAbility",
  [Metric.teleopPoints]: "teleopPoints",
  [Metric.autoPoints]: "autoPoints",
  [Metric.feedsFromNeutral]: "feedsFromNeutral",
  [Metric.feedsFromOpponent]: "feedsFromOpponent",
  [Metric.campDefends]: "campDefends",
  [Metric.blockDefends]: "blockDefends",
  [Metric.shootingAccuracy]: "shootingAccuracy",
  [Metric.outpostIntakes]: "outpostIntakes",
  [Metric.outpostOuttakes]: "outpostOuttakes",
  [Metric.depot]: "depot",
  [Metric.groundIntakes]: "groundIntakes",
  [Metric.fuelScored]: "fuelScored",
};

// Translates between picklist parameters and metric enum
const picklistToMetric: Record<string, Metric> = {
  totalpoints: Metric.totalPoints,
  autopoints: Metric.autoPoints,
  teleoppoints: Metric.teleopPoints,
  driverability: Metric.driverAbility,
  feedsfromneutral: Metric.feedsFromNeutral,
  feedsfromopponent: Metric.feedsFromOpponent,
  campdefends: Metric.campDefends,
  blockdefends: Metric.blockDefends,
  shootingaccuracy: Metric.shootingAccuracy,
  outpostintakes: Metric.outpostIntakes,
  outpostouttakes: Metric.outpostOuttakes,
  depot: Metric.depot,
  groundintakes: Metric.groundIntakes,
  fuelscored: Metric.fuelScored,
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
