import { EventAction, CoralPickup, AlgaePickup, BargeResult, KnocksAlgae, UnderShallowCage, Position, RobotRole, } from "@prisma/client"
//add cooperation

// General numeric metrics
enum Metric {
    totalPoints, driverAbility, teleopPoints, autoPoints, feeds, defends, // General game metrics
    coralPickups, algaePickups, coralDrops, algaeDrops, // Game piece interactions
    coralL1, coralL2, coralL3, coralL4, coralScores, processorScores, netScores, netFails, // Game piece scoring
    autonLeaves, bargePoints // Auto/Endgame
}

// !!!IMPORTANT!!! toString() must return a property of ScoutReport
// Metrics for discrete ScoutReport fields
enum MetricsBreakdown {robotRole, algaePickup, coralPickup, bargeResult, KnocksAlgae, UnderShallowCage}

// Ranking metrics
const metricsCategory: Metric[] = [Metric.totalPoints, Metric.driverAbility, Metric.teleopPoints, Metric.autoPoints, Metric.feeds, Metric.defends, Metric.coralPickups, Metric.algaePickups, Metric.coralDrops, Metric.algaeDrops, Metric.coralL1, Metric.coralL2, Metric.coralL3, Metric.coralL4, Metric.processorScores, Metric.netScores, Metric.netFails, Metric.autonLeaves]

// Picklist sliders for app
const picklistSliders = [Metric.totalPoints, Metric.driverAbility, Metric.teleopPoints, Metric.autoPoints, Metric.feeds, Metric.defends, Metric.coralPickups, Metric.algaePickups, Metric.bargePoints, Metric.coralL1, Metric.coralL2, Metric.coralL3, Metric.coralL4]

const autoEnd = 18
const teleopStart = 19
//much longer than needed in case they go over time/start match early
const matchTimeEnd = 3000

const specificMatchPageMetrics = [Metric.defends, Metric.algaePickups, Metric.coralPickups, Metric.coralScores, Metric.processorScores, Metric.netScores, Metric.netFails]

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
    [Metric.coralScores]: EventAction.SCORE_CORAL,
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

// For occasional query optimizations
const tournamentLowerBound = 497
const teamLowerBound = 3300 // Total 3468 as of 2024 season

// For large database requests
const swrConstant = 300
const ttlConstant = 200

const multiplerBaseAnalysis = 4
export {Metric, metricsCategory, picklistSliders, autoEnd, teleopStart, matchTimeEnd, specificMatchPageMetrics, MetricsBreakdown, multiplerBaseAnalysis, endgameToPoints, metricToEvent, FlippedPositionMap, FlippedActionMap, FlippedRoleMap, tournamentLowerBound, teamLowerBound, swrConstant, ttlConstant};


