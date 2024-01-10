import { EventAction, HighNoteResult, RobotRole, StageResult } from "@prisma/client"
//add cooperation


const metricsCategory =  ["totalpoints","driverability", "teleoppoints", "autopoints", "pickups", "ampscores", "speakerscores", "trapscores", "feeds", "drops"]
const metricsBreakdown = ["robotRole", "pickUp", "highNote"]
//includes picklist sliders
//havent done stage or highnote yet 
const picklistSliders =  ["totalpoints","driverability", "teleoppoints", "autopoints", "pickups", "ampscores", "speakerscores", "trapscores", "stage", "cooperation", "feeds"]
const autoEnd = 17
const teleopStart = 18
const matchTimeEnd = 300
const specificMatchPageMetrics = ["defense", "ampscores", "speakerscores", "trapscores", "pickups"] 
const driverAbility = "driverability"
const exludedAutoEvents = [EventAction.DROP_RING]


const stageMap = {
    [StageResult.NOTHING]: 0,
    [StageResult.PARK] : 1,
    [StageResult.ONSTAGE] : 3,
    [StageResult.ONSTAGE_HARMONY] : 5

}
// const trapMap = {
//     [] :0,
//     "FAILED" : 0,
//     "SUCCESSFUL" : 5
// }
const highNoteMap = {
    [HighNoteResult.NOT_ATTEMPTED] :0,
    [HighNoteResult.FAILED] : 0,
    [HighNoteResult.SUCCESSFUL] : 1
}

RobotRole.OFFENSE

const metricToEvent = {
    "totalpoints" : "totalpoints",
    "teleoppoints" : "teleoppoints",
    "driverability" : "driverability",
    "autopoints" : "autopoints",
    "pickups" : [EventAction.PICK_UP],
    "ampscores" : [EventAction.SCORE_AMP],
    "speakerscores" : [EventAction.SCORE_SPEAKER],
    "trapscores" : [EventAction.SCORE_TRAP],
    "stage" : "stage",
    "cooperation" : "cooperation",
    "feeds" : [EventAction.FEED_RING],
    "drops" : [EventAction.DROP_RING]

}

const multiplerBaseAnalysis = 4
export { metricsCategory, picklistSliders, autoEnd, teleopStart, matchTimeEnd, specificMatchPageMetrics, driverAbility, metricsBreakdown, multiplerBaseAnalysis, stageMap, highNoteMap, metricToEvent, exludedAutoEvents};


