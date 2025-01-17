import { EventAction, CoralPickup, AlgaePickup, BargeResult, KnocksAlgae, UnderShallowCage, Position, RobotRole, } from "@prisma/client"
//add cooperation

enum Metric {totalpoints, driverability, teleoppoints, autopoints, coralPickups, algaePickups, feeds, defends, dropAlgae, dropCoral, scoreProcessor, level1, level2, level3, level4, bargeResult, scoreNet, failNet, scoreCoral}

// Ranking metrics - havent done stage or highnote yet 
const metricsCategory = [Metric.totalpoints, Metric.driverability, Metric.teleoppoints, Metric.autopoints, Metric.coralPickups, Metric.algaePickups, Metric.scoreProcessor, Metric.feeds, Metric.dropAlgae, Metric.dropCoral, Metric.defends, Metric.level1, Metric.level2, Metric.level3, Metric.level4, Metric.scoreNet, Metric.failNet]

// Picklist sliders for app
const picklistSliders = [Metric.totalpoints, Metric.driverability, Metric.teleoppoints, Metric.autopoints, Metric.coralPickups, Metric.algaePickups, Metric.bargeResult, Metric.level1, Metric.level2, Metric.level3, Metric.level4, Metric.feeds, Metric.defends]

// IMPORTANT!!! toString() must return a property of ScoutReport
enum MetricsBreakdown {robotRole, bargeResult, CoralPickup, AlgaePickup, KnocksAlgae, UnderShallowCage, leavesAuto, coralLevel}

const autoEnd = 18
const teleopStart = 19
//much longer than needed in case they go over time/start match early
const matchTimeEnd = 3000

const specificMatchPageMetrics = [Metric.defends, Metric.scoreCoral, Metric.scoreNet, Metric.failNet, Metric.scoreProcessor, Metric.algaePickups, Metric.coralPickups]
const exludedAutoEvents = [EventAction.DROP_ALGAE, EventAction.DROP_CORAL, EventAction.DEFEND, EventAction.FEED]

const bargeMap = {
    [BargeResult.NOT_ATTEMPTED]: 0,
    [BargeResult.PARKED]: 2,
    [BargeResult.SHALLOW]: 6,
    [BargeResult.FAILED_SHALLOW]: 0,
    [BargeResult.DEEP]: 12,
    [BargeResult.FAILED_DEEP]: 0

}

const roleMap = {
    [RobotRole.OFFENSE]: 0,
    [RobotRole.DEFENSE]: 1,
    [RobotRole.FEEDER]: 2,
    [RobotRole.IMMOBILE]: 3
}

const metricToEvent: Partial<Record<Metric, EventAction>> = {
    //use locations
    [Metric.coralPickups]: EventAction.PICKUP_CORAL,
    [Metric.algaePickups]: EventAction.PICKUP_ALGAE,
    [Metric.dropAlgae]: EventAction.DROP_ALGAE,
    [Metric.dropCoral]: EventAction.DROP_CORAL,
    [Metric.feeds]: EventAction.FEED,
    [Metric.defends]: EventAction.DEFEND,
    [Metric.scoreCoral]: EventAction.SCORE_CORAL,
    [Metric.scoreProcessor]: EventAction.SCORE_PROCESSOR,
    [Metric.scoreNet]: EventAction.SCORE_NET,
    [Metric.failNet]: EventAction.FAIL_NET
}

const FlippedActionMap = {
    [EventAction.PICKUP_CORAL]: 0,
    [EventAction.PICKUP_ALGAE]: 2,
    [EventAction.FEED]: 3,
    [EventAction.AUTO_LEAVE]: 4,
    [EventAction.DEFEND]: 5,
    [EventAction.SCORE_NET]: 6,
    [EventAction.FAIL_NET]: 7,
    [EventAction.SCORE_PROCESSOR]: 8,
    [EventAction.SCORE_CORAL]: 9,
    [EventAction.DROP_ALGAE]: 10,
    [EventAction.DROP_CORAL]: 11,
    [EventAction.STARTING_POSITION]: 12
}

const FlippedPositionMap = {
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

const tournamentLowerBound = 497
const teamLowerBound = 3300

const swrConstant = 300
const ttlConstant = 200

const multiplerBaseAnalysis = 4
export {Metric, metricsCategory, picklistSliders, autoEnd, teleopStart, matchTimeEnd, specificMatchPageMetrics, MetricsBreakdown, multiplerBaseAnalysis, bargeMap, metricToEvent, exludedAutoEvents, FlippedPositionMap, FlippedActionMap, roleMap, tournamentLowerBound, teamLowerBound, swrConstant, ttlConstant};


