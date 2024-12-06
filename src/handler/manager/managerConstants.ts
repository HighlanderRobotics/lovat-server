import { EventAction, Position, EndChargingResult, RobotRole, AutoChargingResult, PickUp, MatchType } from "@prisma/client"

const EventActionMap = {
    0 : [EventAction.LEAVE],
    1 : [EventAction.PICK_UP_CONE],
    2 : [EventAction.PICK_UP_CUBE],
    3 : [EventAction.SCORE],
    4 : [EventAction.DEFENSE],
    5 : [EventAction.STARTING_POSITION]

  }
  const PositionMap = {
    0 : [Position.NONE],
    1 : [Position.GRID_ONE_LOW],
    2 : [Position.GRID_ONE_MID],
    3 : [Position.GRID_ONE_HIGH],
    4 : [Position.GRID_TWO_LOW],
    5 : [Position.GRID_TWO_MID],
    6 : [Position.GRID_TWO_HIGH],
    7 : [Position.GRID_THREE_LOW],
    8 : [Position.GRID_THREE_MID],
    9 : [Position.GRID_THREE_HIGH],
    10 : [Position.SCORE_HIGH],
    11 : [Position.SCORE_MID],
    12 : [Position.SCORE_LOW],
    13 : [Position.AUTO_PIECE_ONE],
    14 : [Position.AUTO_PIECE_TWO],
    15 : [Position.AUTO_PIECE_THREE],
    16 : [Position.AUTO_PIECE_FOUR],
    17 : [Position.START_ONE],
    18 : [Position.START_TWO],
    19 : [Position.START_THREE]
  }
  const RobotRoleMap = {
    0 : [RobotRole.OFFENSE],
    1 : [RobotRole.DEFENSE],
    2 : [RobotRole.IMMOBILE]
  }
  const PickUpMap = {
    0 : [PickUp.GROUND],
    1 : [PickUp.CHUTE],
    2 : [PickUp.SHELF]
  }
  const AutoChargingResultMap = {
    0 : [AutoChargingResult.NOTHING],
    1 : [AutoChargingResult.FAILED],
    2 : [AutoChargingResult.TIPPED],
    3 : [AutoChargingResult.ENGAGED]
  }
  const EndChargingResultMap = {
    0 : [EndChargingResult.NOTHING],
    1 : [EndChargingResult.FAILED],
    2 : [EndChargingResult.TIPPED],
    3 : [EndChargingResult.ENGAGED]
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
export {EventActionMap, PositionMap, RobotRoleMap, PickUpMap, AutoChargingResultMap, EndChargingResultMap, MatchTypeMap, ScouterScheduleMap, ReverseMatchTypeMap, ReverseScouterScheduleMap, MatchTypeToAbrivation, MatchTypeEnumToFull, MatchEnumToAbrivation}

  