import { EventAction, Position, HighNoteResult, RobotRole, StageResult, PickUp, MatchType } from "@prisma/client"

const EventActionMap = {
    0 : [EventAction.LEAVE],
    1 : [EventAction.PICK_UP],
    2 : [EventAction.DROP_RING],
    3 : [EventAction.SCORE],
    4 : [EventAction.DEFENSE],
    5 : [EventAction.FEED_RING],
    6 : ["START"],
    7 : ["STOP"],
    8 : [EventAction.STARTING_POSITION]

  }
  const PositionMap = {
    0 : [Position.NONE],
    1 : [Position.AMP],
    2 : [Position.SPEAKER],
    3 : [Position.TRAP],
    4 : [Position.WING_NEAR_AMP],
    5 : [Position.WING_FRONT_OF_SPEAKER],
    6 : [Position.WING_CENTER],
    7 : [Position.WING_NEAR_SOURCE],
    8 : [Position.GROUND_NOTE_ALLIANCE_NEAR_AMP],
    9 : [Position.GROUND_NOTE_ALLIANCE_FRONT_OF_SPEAKER],
    10 : [Position.GROUND_NOTE_ALLIANCE_BY_SPEAKER],
    11 : [Position.GROUND_NOTE_CENTER_FARTHEST_AMP_SIDE],
    12 : [Position.GROUND_NOTE_CENTER_TOWARD_AMP_SIDE],
    13 : [Position.GROUND_NOTE_CENTER_CENTER],
    14 : [Position.GROUND_NOTE_CENTER_TOWARD_SOURCE_SIDE],
    15 : [Position.GROUND_NOTE_CENTER_FARTHEST_SOURCE_SIDE]

  }
  const RobotRoleMap = {
    0 : [RobotRole.OFFENSE],
    1 : [RobotRole.DEFENSE],
    2 : [RobotRole.FEEDER],
    3 : [RobotRole.IMMOBILE]
  }
  const StageResultMap = {
    0 : [StageResult.NOTHING],
    1 : [StageResult.PARK],
    2 : [StageResult.ONSTAGE],
    3 : [StageResult.ONSTAGE_HARMONY]
  
  }
  const PickUpMap = {
    0 : [PickUp.GROUND],
    1 : [PickUp.CHUTE],
    2 : [PickUp.BOTH]
  }
  const HighNoteMap = 
  {
    0 : [HighNoteResult.NOT_ATTEMPTED],
    1 : [HighNoteResult.FAILED],
    2 : [HighNoteResult.SUCCESSFUL]
  }
  const MatchTypeMap = 
  {
    0 : [MatchType.QUALIFICATION],
    1 : [MatchType.ELIMINATION]
  }
  const ReverseMatchTypeMap = {
    [MatchType.QUALIFICATION] : 0,
    [MatchType.ELIMINATION] : 1
  }
  const ScouterScheduleMap = 
  {
    0 : "team1",
    1 : "team2",
    2 : "team3",
    3 : "team4",
    4 : "team5",
    5 : "team6"
  }
  const ReverseScouterScheduleMap = 
  {
    "team1" : 0,
    "team2" : 1,
    "team3" : 2,
    "team4" : 3,
    "team5" : 4,
    "team6" : 5,
  }
  const MatchTypeToAbrivation = {
    0 : "qm",
    1 : "em"
  }
  const MatchEnumToAbrivation = {
    [MatchType.QUALIFICATION] : "qm",
    [MatchType.ELIMINATION] : "em"

  }
  const MatchTypeEnumToFull = {
    0 : MatchType.QUALIFICATION,
    1 : MatchType.ELIMINATION
  }
export {EventActionMap, PositionMap, RobotRoleMap, StageResultMap, PickUpMap, HighNoteMap, MatchTypeMap, ScouterScheduleMap, ReverseMatchTypeMap, ReverseScouterScheduleMap, MatchTypeToAbrivation, MatchTypeEnumToFull, MatchEnumToAbrivation}

  