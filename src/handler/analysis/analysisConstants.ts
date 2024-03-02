import { EventAction, HighNoteResult, Position, RobotRole, StageResult } from "@prisma/client"
import { singleMatchEventsAverage } from "./coreAnalysis/singleMatchEventsAverage"
//add cooperation


const metricsCategory = ["totalpoints", "driverability", "teleoppoints", "autopoints", "pickups", "ampscores", "speakerscores", "trapscores", "feeds", "drops", "defense"]
const metricsBreakdown = ["robotRole", "pickUp", "highNote", "stage"]
//includes picklist sliders
//havent done stage or highnote yet 
const picklistSliders = ["totalpoints", "driverability", "teleoppoints", "autopoints", "pickups", "ampscores", "speakerscores", "trapscores", "stage", "feeds", "defense"]
const autoEnd = 18
const teleopStart = 19
//much longer than needed in case they go over time/start match early
const matchTimeEnd = 3000
const specificMatchPageMetrics = ["defense", "ampscores", "speakerscores", "trapscores", "pickups"]
const driverAbility = "driverability"
const exludedAutoEvents = [EventAction.DROP_RING, EventAction.DEFENSE, EventAction.FEED_RING]
// const picklistSliderMap = {
//     "totalpoints": "totalPoints",
//     "driverability": "driverAbility",
//     "teleoppoints": "teleopPoints",
//     "autopoints": "autoPoints",
//     "pickups": "pickUps",
//     "ampscores": "ampScores",
//     "speakerscores": "speakerScores",
//     "trapscores": "trapScores",
//     "stage": "stage",
//     "cooperation": "cooperation",
//     "feeds": "feeds",
//     "defense": "defense"
// }

const stageMap = {
    [StageResult.NOTHING]: 0,
    [StageResult.PARK]: 1,
    [StageResult.ONSTAGE]: 2,
    [StageResult.ONSTAGE_HARMONY]: 3

}
// const trapMap = {
//     [] :0,
//     "FAILED" : 0,
//     "SUCCESSFUL" : 5
// }
const highNoteMap = {
    [HighNoteResult.NOT_ATTEMPTED]: 0,
    [HighNoteResult.FAILED]: 0,
    [HighNoteResult.SUCCESSFUL]: 1
}

const roleMap = {
    [RobotRole.OFFENSE]: 0,
    [RobotRole.DEFENSE]: 1,
    [RobotRole.FEEDER]: 2,
    [RobotRole.IMMOBILE]: 3
}
const metricToEvent = {
    "totalpoints": "totalpoints",
    "teleoppoints": "teleoppoints",
    "driverability": "driverability",
    "autopoints": "autopoints",
    //use locations
    "pickups": [EventAction.PICK_UP],
    "ampscores": [EventAction.SCORE],
    "speakerscores": [EventAction.SCORE],
    "trapscores": [EventAction.SCORE],
    "stage": "stage",
    "cooperation": "cooperation",
    "feeds": [EventAction.FEED_RING],
    "drops": [EventAction.DROP_RING],
    "defense": [EventAction.DEFENSE]

}
const FlippedActionMap = {
    [EventAction.LEAVE]: 0,
    [EventAction.PICK_UP]: 1,
    [EventAction.DROP_RING]: 2,
    [EventAction.SCORE]: 3,
    [EventAction.DEFENSE]: 4,
    [EventAction.FEED_RING]: 5,
    // 6 : ["START"],
    // 7 : ["STOP"],
    [EventAction.STARTING_POSITION]: 8

}
const FlippedPositionMap = {
    [Position.NONE]: 0,
    [Position.AMP]: 1,
    [Position.SPEAKER]: 2,
    [Position.TRAP]: 3,
    [Position.WING_NEAR_AMP]: 4,
    [Position.WING_FRONT_OF_SPEAKER]: 5,
    [Position.WING_CENTER]: 6,
    [Position.WING_NEAR_SOURCE]: 7,
    [Position.GROUND_NOTE_ALLIANCE_NEAR_AMP]: 8,
    [Position.GROUND_NOTE_ALLIANCE_FRONT_OF_SPEAKER]: 9,
    [Position.GROUND_NOTE_ALLIANCE_BY_SPEAKER]: 10,
    [Position.GROUND_NOTE_CENTER_FARTHEST_AMP_SIDE]: 11,
    [Position.GROUND_NOTE_CENTER_TOWARD_AMP_SIDE]: 12,
    [Position.GROUND_NOTE_CENTER_CENTER]: 13,
    [Position.GROUND_NOTE_CENTER_TOWARD_SOURCE_SIDE]: 14,
    [Position.GROUND_NOTE_CENTER_FARTHEST_SOURCE_SIDE]: 15,
}


const multiplerBaseAnalysis = 4
export {metricsCategory, picklistSliders, autoEnd, teleopStart, matchTimeEnd, specificMatchPageMetrics, driverAbility, metricsBreakdown, multiplerBaseAnalysis, stageMap, highNoteMap, metricToEvent, exludedAutoEvents, FlippedPositionMap, FlippedActionMap, roleMap };


