import { EventAction, Position, HighNoteResult, RobotRole, StageResult, PickUp } from "@prisma/client"
import { robotRole } from "../analysis/coreAnalysis/robotRole"

const EventActionMap = {
    0 : [EventAction.LEAVE],
    1 : [EventAction.PICK_UP],
    2 : [EventAction.DROP_RING],
    3 : [EventAction.SCORE],
    4 : [EventAction.DEFENSE],
    5 : [EventAction.FEED_RING]
  }
  const PositionMap = {
    0 : [Position.NONE],
    1 : [Position.AMP],
    2 : [Position.SPEAKER],
    3 : [Position.TRAP]
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
export {EventActionMap, PositionMap, RobotRoleMap, StageResultMap, PickUpMap}

  