import { EventAction, Position, RobotRole, MatchType, BargeResult, AlgaePickup, CoralPickup, KnocksAlgae, UnderShallowCage } from "@prisma/client"

const EventActionMap: Record<number, EventAction> = {
    0 : EventAction.PICKUP_CORAL,
    1 : EventAction.PICKUP_ALGAE,
    2 : EventAction.FEED,
    3 : EventAction.AUTO_LEAVE,
    4 : EventAction.DEFEND,
    5 : EventAction.SCORE_NET,
    6 : EventAction.FAIL_NET,
    7 : EventAction.SCORE_PROCESSOR,
    8 : EventAction.SCORE_CORAL,
    9 : EventAction.DROP_ALGAE,
    10 : EventAction.DROP_CORAL,
    11 : EventAction.START_POSITION
  }
  const PositionMap: Record<number, Position> = { 
    0 : Position.NONE,
    1 : Position.START_ONE,
    2 : Position.START_TWO,
    3 : Position.START_THREE,
    4 : Position.START_FOUR,
    5 : Position.LEVEL_ONE,
    6 : Position.LEVEL_TWO,
    7 : Position.LEVEL_THREE,
    8 : Position.LEVEL_FOUR,
    9 : Position.LEVEL_ONE_A,
    10 : Position.LEVEL_ONE_B,
    11 : Position.LEVEL_ONE_C,
    12 : Position.LEVEL_TWO_A,
    13 : Position.LEVEL_TWO_B,
    14 : Position.LEVEL_TWO_C,
    15 : Position.LEVEL_THREE_A,
    16 : Position.LEVEL_THREE_B,
    17 : Position.LEVEL_THREE_C,
    18 : Position.LEVEL_FOUR_A,
    19 : Position.LEVEL_FOUR_B,
    20 : Position.LEVEL_FOUR_C,
    21 : Position.GROUND_PIECE_A,
    22 : Position.GROUND_PIECE_B,
    23 : Position.GROUND_PIECE_C,
    24 : Position.CORAL_STATION_ONE,
    25 : Position.CORAL_STATION_TWO
  }
  const RobotRoleMap: Record<number, RobotRole> = {
    0 : RobotRole.OFFENSE,
    1 : RobotRole.DEFENSE,
    2 : RobotRole.FEEDER,
    3 : RobotRole.IMMOBILE
  }

  const BargeResultMap: Record<number, BargeResult> = {
    0 : BargeResult.NOT_ATTEMPTED,
    1 : BargeResult.PARKED,
    2 : BargeResult.SHALLOW,
    3 : BargeResult.FAILED_SHALLOW,
    4 : BargeResult.DEEP,
    5 : BargeResult.FAILED_DEEP
  }
  const BargeResultReverseMap: Record<BargeResult, number> = {
    [BargeResult.NOT_ATTEMPTED] : 0,
    [BargeResult.PARKED] : 1,
    [BargeResult.SHALLOW] : 2,
    [BargeResult.FAILED_SHALLOW]: 3,
    [BargeResult.DEEP] : 4,
    [BargeResult.FAILED_DEEP] : 5,
  }

  const AlgaePickupMap: Record<number, AlgaePickup> = {
    0 : AlgaePickup.NONE,
    1 : AlgaePickup.GROUND,
    2 : AlgaePickup.REEF,
    3 : AlgaePickup.BOTH
  }
  const CoralPickupMap: Record<number, CoralPickup> = {
    0 : CoralPickup.NONE,
    1 : CoralPickup.GROUND,
    2 : CoralPickup.STATION,
    3 : CoralPickup.BOTH
  }
  const  KnocksAlgaeMap: Record<number, KnocksAlgae> = {
    0 : KnocksAlgae.NO,
    1 : KnocksAlgae.YES
  }
  const  UnderShallowCageMap: Record<number, UnderShallowCage> = {
    0 : UnderShallowCage.NO,
    1 : UnderShallowCage.YES
  }

  const MatchTypeMap: Record<number, MatchType> = {
    0 : MatchType.QUALIFICATION,
    1 : MatchType.ELIMINATION
  }
  const ReverseMatchTypeMap: Record<MatchType, number> = {
    [MatchType.QUALIFICATION] : 0,
    [MatchType.ELIMINATION] : 1
  }
  const ScouterScheduleMap = {
    0 : "team1",
    1 : "team2",
    2 : "team3",
    3 : "team4",
    4 : "team5",
    5 : "team6"
  }
  const ReverseScouterScheduleMap = {
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
  const MatchEnumToAbrivation: Record<MatchType, string> = {
    [MatchType.QUALIFICATION] : "qm",
    [MatchType.ELIMINATION] : "em"
  }

  const SLACK_WARNINGS = ["no-leave", "immobile"] as const;

export {EventActionMap, PositionMap, RobotRoleMap, BargeResultMap, AlgaePickupMap, CoralPickupMap, KnocksAlgaeMap, UnderShallowCageMap, MatchTypeMap, ScouterScheduleMap, ReverseMatchTypeMap, ReverseScouterScheduleMap, MatchTypeToAbrivation, MatchEnumToAbrivation, BargeResultReverseMap, SLACK_WARNINGS}

  