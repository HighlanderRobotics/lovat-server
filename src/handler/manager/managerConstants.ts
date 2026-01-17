import {
  EventAction,
  Position,
  RobotRole,
  MatchType,
  EndgameClimbResult,
} from "@prisma/client";

const EventActionMap: Record<number, EventAction> = {
  0: EventAction.START_SCORING,
  1: EventAction.STOP_SCORING,
  2: EventAction.START_MATCH,
  3: EventAction.START_CAMPING,
  4: EventAction.STOP_CAMPING,
  5: EventAction.START_DEFENDING,
  6: EventAction.STOP_DEFENDING,
  7: EventAction.INTAKE,
  8: EventAction.OUTTAKE,
  9: EventAction.DISRUPT,
  10: EventAction.CROSS,
  11: EventAction.CLIMB,
  12: EventAction.START_FEEDING,
  13: EventAction.STOP_FEEDING,
};
const PositionMap: Record<number, Position> = {
  0: Position.LEFT_TRENCH,
  1: Position.LEFT_BUMP,
  2: Position.HUB,
  3: Position.RIGHT_TRENCH,
  4: Position.RIGHT_BUMP,
  5: Position.NEUTRAL_ZONE,
  6: Position.DEPOT,
  7: Position.OUTPOST,
  8: Position.FIRST_RUNG,
  9: Position.SECOND_RUNG,
  10: Position.THIRD_RUNG,
  11: Position.START_A,
  12: Position.START_B,
  13: Position.START_C,
  14: Position.START_D,
  15: Position.START_E,
};
const RobotRoleMap: Record<number, RobotRole> = {
  0: RobotRole.CYCLING,
  1: RobotRole.STEALING,
  2: RobotRole.SCORING,
  3: RobotRole.FEEDING,
  4: RobotRole.DEFENDING,
  5: RobotRole.IMMOBILE,
};

const ClimbResultMap: Record<number, EndgameClimbResult> = {
  0: EndgameClimbResult.NOT_ATTEMPTED,
  1: EndgameClimbResult.LEVEL_ONE,
  2: EndgameClimbResult.LEVEL_TWO,
  3: EndgameClimbResult.LEVEL_THREE,
  4: EndgameClimbResult.FAILED,
};

const ClimbResultReverseMap: Record<EndgameClimbResult, number> = {
  [EndgameClimbResult.NOT_ATTEMPTED]: 0,
  [EndgameClimbResult.LEVEL_ONE]: 1,
  [EndgameClimbResult.LEVEL_TWO]: 2,
  [EndgameClimbResult.LEVEL_THREE]: 3,
  [EndgameClimbResult.FAILED]: 4,
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
