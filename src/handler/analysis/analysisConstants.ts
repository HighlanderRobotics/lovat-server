import { EventAction, BargeResult, Position, RobotRole} from "@prisma/client"
import prismaClient from '../../prismaClient'
//add cooperation

// Tunable constants
const defaultSTD = 0.1;
const defaultEndgamePoints = 1.5;

// General numeric metrics
enum Metric {
    totalPoints, driverAbility, teleopPoints, autoPoints, feeds, defends, // General game metrics
    coralPickups, algaePickups, coralDrops, algaeDrops, // Game piece interactions
    coralL1, coralL2, coralL3, coralL4, processorScores, netScores, netFails, // Game piece scoring
    autonLeaves, bargePoints // Auto/Endgame
}

// !!!IMPORTANT!!! toString() must return a property of ScoutReport
// Metrics for discrete ScoutReport fields
enum MetricsBreakdown {
    robotRole = "robotRole",
    algaePickup = "algaePickup",
    coralPickup = "coralPickup",
    bargeResult = "bargeResult",
    knocksAlgae = "knocksAlgae",
    underShallowCage = "underShallowCage",
    leavesAuto = "leavesAuto"
}

// Ranking metrics
const metricsCategory: Metric[] = [Metric.totalPoints, Metric.driverAbility, Metric.teleopPoints, Metric.autoPoints, Metric.feeds, Metric.defends, Metric.coralPickups, Metric.algaePickups, Metric.coralDrops, Metric.algaeDrops, Metric.coralL1, Metric.coralL2, Metric.coralL3, Metric.coralL4, Metric.processorScores, Metric.netScores, Metric.netFails]

// To differentiate auton and teleop events, benefit of the doubt given to auto
const autoEnd = 18

const specificMatchPageMetrics = [Metric.defends, Metric.coralL1, Metric.coralL2, Metric.coralL3, Metric.coralL4, Metric.processorScores, Metric.netScores, Metric.netFails]

// Easy point calculation
const endgameToPoints: Record<BargeResult, number> = {
    [BargeResult.NOT_ATTEMPTED]: 0,
    [BargeResult.PARKED]: 2,
    [BargeResult.SHALLOW]: 6,
    [BargeResult.FAILED_SHALLOW]: 0,
    [BargeResult.DEEP]: 12,
    [BargeResult.FAILED_DEEP]: 0
}

// Metrics that are analyzed by event count
const metricToEvent: Partial<Record<Metric, EventAction>> = {
    [Metric.feeds]: EventAction.FEED,
    [Metric.defends]: EventAction.DEFEND,
    [Metric.coralPickups]: EventAction.PICKUP_CORAL,
    [Metric.algaePickups]: EventAction.PICKUP_ALGAE,
    [Metric.coralDrops]: EventAction.DROP_CORAL,
    [Metric.algaeDrops]: EventAction.DROP_ALGAE,
    [Metric.coralL1]: EventAction.SCORE_CORAL,
    [Metric.coralL2]: EventAction.SCORE_CORAL,
    [Metric.coralL3]: EventAction.SCORE_CORAL,
    [Metric.coralL4]: EventAction.SCORE_CORAL,
    [Metric.processorScores]: EventAction.SCORE_PROCESSOR,
    [Metric.netScores]: EventAction.SCORE_NET,
    [Metric.netFails]: EventAction.FAIL_NET,
    [Metric.autonLeaves] : EventAction.AUTO_LEAVE
}

const FlippedRoleMap: Record<RobotRole, number> = {
    [RobotRole.OFFENSE]: 0,
    [RobotRole.DEFENSE]: 1,
    [RobotRole.FEEDER]: 2,
    [RobotRole.IMMOBILE]: 3
}

const FlippedActionMap: Record<EventAction, number> = {
    [EventAction.PICKUP_CORAL]: 0,
    [EventAction.PICKUP_ALGAE]: 1,
    [EventAction.FEED]: 2,
    [EventAction.AUTO_LEAVE]: 3,
    [EventAction.DEFEND]: 4,
    [EventAction.SCORE_NET]: 5,
    [EventAction.FAIL_NET]: 6,
    [EventAction.SCORE_PROCESSOR]: 7,
    [EventAction.SCORE_CORAL]: 8,
    [EventAction.DROP_ALGAE]: 9,
    [EventAction.DROP_CORAL]: 10,
    [EventAction.START_POSITION]: 11
}

const FlippedPositionMap: Record<Position, number> = {
    [Position.NONE]: 0,
    [Position.START_ONE]: 1,
    [Position.START_TWO]: 2,
    [Position.START_THREE]: 3,
    [Position.START_FOUR]: 4,
    [Position.LEVEL_ONE]: 5,
    [Position.LEVEL_TWO]: 6,
    [Position.LEVEL_THREE]: 7,
    [Position.LEVEL_FOUR]: 8,
    [Position.LEVEL_ONE_A]: 9,
    [Position.LEVEL_ONE_B]: 10,
    [Position.LEVEL_ONE_C]: 11,
    [Position.LEVEL_TWO_A]: 12,
    [Position.LEVEL_TWO_B]: 13,
    [Position.LEVEL_TWO_C]: 14,
    [Position.LEVEL_THREE_A]: 15,
    [Position.LEVEL_THREE_B]: 16,
    [Position.LEVEL_THREE_C]: 17,
    [Position.LEVEL_FOUR_A]: 18,
    [Position.LEVEL_FOUR_B]: 19,
    [Position.LEVEL_FOUR_C]: 20,
    [Position.GROUND_PIECE_A]: 21,
    [Position.GROUND_PIECE_B]: 22,
    [Position.GROUND_PIECE_C]: 23,
    [Position.CORAL_STATION_ONE]: 24,
    [Position.CORAL_STATION_TWO]: 25
}

const metricsToNumber: Record<string, number> = {
    totalPoints : 0,
    driverAbility : 1,
    teleopPoints : 2,
    autoPoints : 3,
    feeds : 4,
    defends : 5,
    coralPickups : 6,
    algaePickups : 7,
    coralDrops : 8,
    algaeDrops : 9,
    coralL1 : 10,
    coralL2 : 11,
    coralL3 : 12,
    coralL4 : 13,
    processorScores : 14,
    netScores : 15,
    netFails : 16,
    autonLeaves : 17,
    bargePoints : 18
}

const metricToName: Record<Metric, string> = {
    [Metric.totalPoints]: "totalPoints",
    [Metric.driverAbility]: "driverAbility",
    [Metric.teleopPoints]: "teleopPoints",
    [Metric.autoPoints]: "autoPoints",
    [Metric.feeds]: "feeds",
    [Metric.defends]: "defends",
    [Metric.coralPickups]: "coralPickups",
    [Metric.algaePickups]: "algaePickups",
    [Metric.coralDrops]: "coralDrops",
    [Metric.algaeDrops]: "algaeDrops",
    [Metric.coralL1]: "coralL1",
    [Metric.coralL2]: "coralL2",
    [Metric.coralL3]: "coralL3",
    [Metric.coralL4]: "coralL4",
    [Metric.processorScores]: "processorScores",
    [Metric.netScores]: "netScores",
    [Metric.netFails]: "netFails",
    [Metric.autonLeaves]: "autonLeaves",
    [Metric.bargePoints]: "bargePoints"
}

// Translates between picklist parameters and metric enum
const picklistToMetric: Record<string, Metric> = {
    totalpoints: Metric.totalPoints,
    autopoints: Metric.autoPoints,
    teleoppoints: Metric.teleopPoints,
    driverability: Metric.driverAbility,
    bargeresult: Metric.bargePoints,
    level1: Metric.coralL1,
    level2: Metric.coralL2,
    level3: Metric.coralL3,
    level4: Metric.coralL4,
    coralpickup: Metric.coralPickups,
    algaeProcessor: Metric.processorScores,
    algaeNet: Metric.netScores,
    algaePickups: Metric.algaePickups,
    feeds: Metric.feeds,
    defends: Metric.defends
}

// For occasional query optimizations
const tournamentLowerBound = 497
const teamLowerBound = 3300 // Total 3468 as of 2024 season

// For large database requests
const swrConstant = 300
const ttlConstant = 200

// Caching this for later
const allTeamNumbers = (async () => {
    return (await prismaClient.team.findMany()).map(team => team.number);
})()
const allTournaments = (async () => {
    return (await prismaClient.tournament.findMany({
        orderBy: [
            { date: 'asc' } // Most recent last
        ]
    })).map(tnmt => tnmt.key);
})()

const multiplerBaseAnalysis = 4
export {defaultEndgamePoints, defaultSTD, Metric, metricsCategory, autoEnd, specificMatchPageMetrics, MetricsBreakdown, multiplerBaseAnalysis, endgameToPoints, metricToEvent, FlippedPositionMap, FlippedActionMap, FlippedRoleMap, metricToName, picklistToMetric, tournamentLowerBound, teamLowerBound, swrConstant, ttlConstant, metricsToNumber, allTeamNumbers, allTournaments};


