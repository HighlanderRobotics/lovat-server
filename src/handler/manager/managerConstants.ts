import {
  EventAction,
  Position,
  RobotRole,
  MatchType,
  ClimbResult,
} from "@prisma/client";

const EventActionMap: Record<number, EventAction> = {
  0: EventAction.GROUND_INTAKE,
  1: EventAction.OUTPOST_INTAKE,
  2: EventAction.OUTPOST_OUTTAKE,
  3: EventAction.DEPOT_INTAKE,
  4: EventAction.SCORE_FUEL,
  5: EventAction.FEED_OPPONENT,
  6: EventAction.FEED_NEUTRAL,
  7: EventAction.DEFEND_CAMP,
  8: EventAction.DEFEND_BLOCK,
  9: EventAction.START_POSITION,
};
const PositionMap: Record<number, Position> = {
  0: Position.NONE,
  1: Position.ALLIANCE_ZONE,
  2: Position.DEPOT,
  3: Position.OUTPOST,
  4: Position.NEUTRAL_ZONE,
  5: Position.START_A,
  6: Position.START_B,
  7: Position.START_C,
  8: Position.START_D,
  9: Position.START_E,
};
const RobotRoleMap: Record<number, RobotRole> = {
  0: RobotRole.OFFENSE,
  1: RobotRole.DEFENSE,
  2: RobotRole.FEEDER,
  3: RobotRole.IMMOBILE,
};

const ClimbResultMap: Record<number, ClimbResult> = {
  0: ClimbResult.NOT_ATTEMPTED,
  1: ClimbResult.LEFT_ONE,
  2: ClimbResult.LEFT_TWO,
  3: ClimbResult.LEFT_THREE,
  4: ClimbResult.MIDDLE_ONE,
  5: ClimbResult.MIDDLE_TWO,
  6: ClimbResult.MIDDLE_THREE,
  7: ClimbResult.RIGHT_ONE,
  8: ClimbResult.RIGHT_TWO,
  9: ClimbResult.RIGHT_THREE,
  10: ClimbResult.BACK_ONE,
  11: ClimbResult.BACK_TWO,
  12: ClimbResult.BACK_THREE,
};
const ClimbResultReverseMap: Record<ClimbResult, number> = {
  [ClimbResult.NOT_ATTEMPTED]: 0,
  [ClimbResult.LEFT_ONE]: 1,
  [ClimbResult.LEFT_TWO]: 2,
  [ClimbResult.LEFT_THREE]: 3,
  [ClimbResult.MIDDLE_ONE]: 4,
  [ClimbResult.MIDDLE_TWO]: 5,
  [ClimbResult.MIDDLE_THREE]: 6,
  [ClimbResult.RIGHT_ONE]: 7,
  [ClimbResult.RIGHT_TWO]: 8,
  [ClimbResult.RIGHT_THREE]: 9,
  [ClimbResult.BACK_ONE]: 10,
  [ClimbResult.BACK_TWO]: 11,
  [ClimbResult.BACK_THREE]: 12,
};

const MatchTypeMap: Record<number, MatchType> = {
  0: MatchType.QUALIFICATION,
  1: MatchType.ELIMINATION,
};
const ReverseMatchTypeMap: Record<MatchType, number> = {
  [MatchType.QUALIFICATION]: 0,
  [MatchType.ELIMINATION]: 1,
};
const ScouterScheduleMap = {
  0: "team1",
  1: "team2",
  2: "team3",
  3: "team4",
  4: "team5",
  5: "team6",
};
const ReverseScouterScheduleMap = {
  team1: 0,
  team2: 1,
  team3: 2,
  team4: 3,
  team5: 4,
  team6: 5,
};
const MatchTypeToAbrivation = {
  0: "qm",
  1: "em",
};
const MatchEnumToAbrivation: Record<MatchType, string> = {
  [MatchType.QUALIFICATION]: "qm",
  [MatchType.ELIMINATION]: "em",
};

export {
  EventActionMap,
  PositionMap,
  RobotRoleMap,
  ClimbResultMap,
  MatchTypeMap,
  ScouterScheduleMap,
  ReverseMatchTypeMap,
  ReverseScouterScheduleMap,
  MatchTypeToAbrivation,
  MatchEnumToAbrivation,
  ClimbResultReverseMap,
};
