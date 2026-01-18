import { Response } from "express";
import prismaClient from "../../../prismaClient.js";
import z from "zod";
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth.js";
import {
  PositionMap,
  MatchTypeMap,
  RobotRoleMap,
  EventActionMap,
} from "../managerConstants.js";
import { addTournamentMatches } from "../addTournamentMatches.js";
import { totalPointsScoutingLead } from "../../analysis/scoutingLead/totalPointsScoutingLead.js";
import {
  AutoClimb,
  Beached,
  EndgameClimb,
  EventAction,
  FeederType,
  IntakeType,
  MatchType,
  Position,
  RobotRole,
  Mobility,
  ClimbPosition,
  ClimbSide,
} from "@prisma/client";
import { invalidateCache } from "../../../lib/clearCache.js";

export const addScoutReportDashboard = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const paramsScoutReport = z
      .object({
        uuid: z.string(),
        tournamentKey: z.string(),
        matchType: z.nativeEnum(MatchType),
        matchNumber: z.number(),
        startTime: z.number(),
        notes: z.string(),
        robotRoles: z.array(z.nativeEnum(RobotRole)),
        autoClimb: z.nativeEnum(AutoClimb),
        endgameClimb: z.nativeEnum(EndgameClimb),
        beached: z.nativeEnum(Beached),
        feederType: z.nativeEnum(FeederType),
        intakeType: z.nativeEnum(IntakeType),
        mobility: z.nativeEnum(Mobility),
        climbPosition: z.nativeEnum(ClimbPosition).optional(),
        climbSide: z.nativeEnum(ClimbSide).optional(),
        robotBrokeDescription: z
          .union([z.string(), z.null(), z.undefined()])
          .optional(),
        driverAbility: z.number(),
        accuracy: z.number(),
        disrupts: z.boolean(),
        defenseEffectiveness: z.number(),
        scoresWhileMoving: z.boolean(),
        scouterUuid: z.string(),
        teamNumber: z.number(),
      })
      .parse(req.body);

    const scouter = await prismaClient.scouter.findUnique({
      where: {
        uuid: paramsScoutReport.scouterUuid,
      },
    });
    if (!scouter) {
      res.status(400).send({
        error: `This ${paramsScoutReport.scouterUuid} has been deleted or never existed.`,
        displayError:
          "This scouter has been deleted. Have the scouter reset their settings and choose a new scouter.",
      });
      return;
    }
    if (
      req.user.teamNumber === null ||
      scouter.sourceTeamNumber !== req.user.teamNumber
    ) {
      res.status(401).send({
        error: `User with the id ${req.user.id} is not on the same team as the scouter with the uuid ${scouter.uuid}`,
        displayError: "Not on the same team as the scouter.",
      });
      return;
    }
    const scoutReportUuidRow = await prismaClient.scoutReport.findUnique({
      where: {
        uuid: paramsScoutReport.uuid,
      },
    });
    if (scoutReportUuidRow) {
      res.status(400).send({
        error: `The scout report uuid ${paramsScoutReport.uuid} already exists.`,
        displayError: "Scout report already uploaded",
      });
      return;
    }

    const tournamentMatchRows = await prismaClient.teamMatchData.findMany({
      where: {
        tournamentKey: paramsScoutReport.tournamentKey,
      },
    });
    if (tournamentMatchRows === null || tournamentMatchRows.length === 0) {
      await addTournamentMatches(paramsScoutReport.tournamentKey);
    }
    const matchRow = await prismaClient.teamMatchData.findFirst({
      where: {
        tournamentKey: paramsScoutReport.tournamentKey,
        matchNumber: paramsScoutReport.matchNumber,
        matchType: paramsScoutReport.matchType,
        teamNumber: paramsScoutReport.teamNumber,
      },
    });
    if (!matchRow) {
      res.status(404).send({
        error: `There are no matches that meet these requirements. ${paramsScoutReport.tournamentKey}, ${paramsScoutReport.matchNumber}, ${paramsScoutReport.matchType}, ${paramsScoutReport.teamNumber}`,
        displayError: "Match does not exist",
      });
      return;
    }
    const matchKey = matchRow.key;

    const row = await prismaClient.scoutReport.create({
      data: {
        //constants
        uuid: paramsScoutReport.uuid,
        teamMatchKey: matchKey,
        startTime: new Date(paramsScoutReport.startTime),
        scouterUuid: paramsScoutReport.scouterUuid,
        notes: paramsScoutReport.notes,
        // Store first role for compatibility
        robotRole: paramsScoutReport.robotRoles[0],
        driverAbility: paramsScoutReport.driverAbility,
        //game specific
        endgameClimb: paramsScoutReport.endgameClimb,
        beached: paramsScoutReport.beached,
        feederType: paramsScoutReport.feederType,
        intakeType: paramsScoutReport.intakeType,
        mobility: paramsScoutReport.mobility,
        defenseEffectiveness: paramsScoutReport.defenseEffectiveness,
        scoresWhileMoving: paramsScoutReport.scoresWhileMoving,
        robotBrokeDescription: paramsScoutReport.robotBrokeDescription ?? null,
        accuracy: paramsScoutReport.accuracy,
        autoClimb: paramsScoutReport.autoClimb,
        climbPosition: paramsScoutReport.climbPosition,
        climbSide: paramsScoutReport.climbSide,
        disrupts: paramsScoutReport.disrupts,
      },
    });

    invalidateCache(
      paramsScoutReport.teamNumber,
      paramsScoutReport.tournamentKey,
    );

    const scoutReportUuid = row.uuid;
    const eventDataArray: {
      time: number;
      action: EventAction;
      position: Position;
      points: number;
      scoutReportUuid: string;
    }[] = [];
    const events = req.body.events;
    for (let i = 0; i < events.length; i++) {
      const time = events[i][0];
      const position = PositionMap[events[i][2]];
      const action = EventActionMap[events[i][1]];
      let points = 0;
      if (action === EventAction.STOP_SCORING) {
        points = events[i][3];
      }
      const paramsEvents = z
        .object({
          time: z.number(),
          action: z.nativeEnum(EventAction),
          position: z.nativeEnum(Position),
          points: z.number(),
          scoutReportUuid: z.string(),
        })
        .safeParse({
          scoutReportUuid: scoutReportUuid,
          time: time,
          action: action,
          position: position,
          points: points,
        });
      if (!paramsEvents.success) {
        res.status(400).send({
          error: paramsEvents,
          displayError:
            "Invalid input. Make sure you are using the correct input.",
        });
        return;
      }
      eventDataArray.push({
        time: paramsEvents.data.time,
        action: paramsEvents.data.action,
        position: paramsEvents.data.position,
        points: paramsEvents.data.points,
        scoutReportUuid: scoutReportUuid,
      });
    }
    await prismaClient.event.createMany({
      data: eventDataArray,
    });
    await totalPointsScoutingLead(req.user, { scoutReportUuid });
    res.status(200).send("done adding data");
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).send({
        displayError:
          "Invalid input. Make sure you are using the correct input.",
      });
      return;
    }
    console.log(error);
    res.status(500).send({ error: error, displayError: "Error" });
  }
};
