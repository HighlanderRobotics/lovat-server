const metricsCategory =  ["totalpoints","driverability", "teleoppoints", "autopoints", "pickups", "ampscores", "speakerscores", "trapscores"]
const metricsBreakdown = ["robotRole", "pickUp", "trap", "highNote"]
const picklistSliders = ["put", "slicerNames", "here"]
const autoEnd = 17
const teleopStart = 18
const matchTimeEnd = 300
const specificMatchPageMetrics = ["defense"]
const driverAbility = "driverability"

const stageMap = {
    "NOTHING" : 0,
    "PARK" : 1,
    "ONSTAGE" : 3,
    "ONSTAGE_HARMONY" : 5

}
const trapMap = {
    "NOT_ATTEMPTED" :0,
    "FAILED" : 0,
    "SUCCESSFUL" : 5
}
const highNoteMap = {
    "NOT_ATTEMPTED" :0,
    "FAILED" : 0,
    "SUCCESSFUL" : 1
}
const metricToEvent = {
    "totalpoints" : "totalpoints",
    "teleoppoints" : "teleoppoints",
    "driverability" : "driverability",
    "autopoints" : "autopoints",
    "pickups" : "PICK_UP",
    "ampscores" : "SCORE_AMP",
    "speakerscores" : "SCORE_SPEAKER"

}

const multiplerBaseAnalysis = 4
export { metricsCategory, picklistSliders, autoEnd, teleopStart, matchTimeEnd, specificMatchPageMetrics, driverAbility, metricsBreakdown, multiplerBaseAnalysis, stageMap, trapMap, highNoteMap, metricToEvent};


