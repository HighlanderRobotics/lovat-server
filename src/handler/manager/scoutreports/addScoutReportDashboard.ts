import { Response } from "express";
import prismaClient from "../../../prismaClient.js";
import z from "zod";
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth.js";
import {
  PositionMap,
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
import { sendWarningToSlack } from "../../slack/sendWarningNotification.js";
import { PrismaClient } from "@prisma/client/extension";
import {
  PrismaClientKnownRequestError,
} from "@prisma/client/runtime/library";

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
        mobility: z.nativeEnum(Mobility),
        climbPosition: z.nativeEnum(ClimbPosition).optional(),
        climbSide: z.nativeEnum(ClimbSide).optional(),
        beached: z.nativeEnum(Beached),
        feederTypes: z.array(z.nativeEnum(FeederType)),
        intakeType: z.nativeEnum(IntakeType),
        robotBrokeDescription: z
          .union([z.string(), z.null(), z.undefined()])
          .optional(),
        driverAbility: z.number(),
        accuracy: z.number(),
        disrupts: z.boolean(),
        defenseEffectiveness: z.number(),
        scoresWhileMoving: z.boolean(),
        autoClimb: z.nativeEnum(AutoClimb),
        endgameClimb: z.nativeEnum(EndgameClimb),
        scouterUuid: z.string(),
        teamNumber: z.number(),
      })
      .parse(req.body);

    // Check scouter exists and team authorization
    const scouter = await prismaClient.scouter.findFirst({
      where: { uuid: paramsScoutReport.scouterUuid },
    });
    if (!scouter) {
      res.status(400).send({
        error: `This scouter has been deleted or never existed.`,
        displayError:
          "This scouter has been deleted. Reset your settings and choose a new scouter.",
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

    // Ensure tournament matches exist
    const tournamentMatchRows = await prismaClient.teamMatchData.findMany({
      where: {
        tournamentKey: paramsScoutReport.tournamentKey,
      },
    });
    if (tournamentMatchRows === null || tournamentMatchRows.length === 0) {
      await addTournamentMatches(paramsScoutReport.tournamentKey);
    }

    // Find target TeamMatchData row
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

    // Create scout report using relations to match core handler
    await prismaClient.scoutReport.create({
      data: {
        uuid: paramsScoutReport.uuid,
        startTime: new Date(paramsScoutReport.startTime),
        teamMatchData: { connect: { key: matchKey } },
        scouter: { connect: { uuid: paramsScoutReport.scouterUuid } },
        notes: paramsScoutReport.notes,
        robotRoles: paramsScoutReport.robotRoles,
        driverAbility: paramsScoutReport.driverAbility,
        robotBrokeDescription: paramsScoutReport.robotBrokeDescription ?? null,
        autoClimb: paramsScoutReport.autoClimb,
        beached: paramsScoutReport.beached,
        feederTypes: paramsScoutReport.feederTypes,
        intakeType: paramsScoutReport.intakeType,
        mobility: paramsScoutReport.mobility,
        defenseEffectiveness: paramsScoutReport.defenseEffectiveness,
        scoresWhileMoving: paramsScoutReport.scoresWhileMoving,
        accuracy: paramsScoutReport.accuracy,
        climbPosition: paramsScoutReport.climbPosition,
        climbSide: paramsScoutReport.climbSide,
        endgameClimb: paramsScoutReport.endgameClimb,
        disrupts: paramsScoutReport.disrupts,
      },
    });

    // Invalidate cached analyses
    invalidateCache(
      paramsScoutReport.teamNumber,
      paramsScoutReport.tournamentKey,
    );

    const scoutReportUuid = paramsScoutReport.uuid;

    // Validate event sequence with matching start/stop types
    const events = req.body.events as number[][];
    let inEvent: string | null = null;
    for (const event of events) {
      const eventType = EventActionMap[event[1]].toString().split("_");
      switch (eventType[0]) {
        case "START":
          if (eventType[1] === "MATCH") {
            // ignore match start
            break;
          } else if (inEvent !== null) {
            res.status(400).send({
              error: `Invalid input. Cannot start ${eventType[1]} event while already in ${inEvent} event.`,
              displayError: `Invalid input. Cannot start ${eventType[1]} event while already in ${inEvent} event.`,
            });
            return;
          }
          inEvent = eventType[1];
          break;
        case "STOP":
          if (inEvent === null) {
            res.status(400).send({
              error: `Invalid input. Cannot stop ${eventType[1]} event while not in any event.`,
              displayError: `Invalid input. Cannot stop ${eventType[1]} event while not in any event.`,
            });
            return;
          } else if (inEvent !== eventType[1]) {
            res.status(400).send({
              error: `Invalid input. Cannot stop ${eventType[1]} event while in ${inEvent} event.`,
              displayError: `Invalid input. Cannot stop ${eventType[1]} event while in ${inEvent} event.`,
            });
            return;
          }
          inEvent = null;
          break;
        default:
          break;
      }
    }
    if (inEvent !== null) {
      res.status(400).send({
        error: `Invalid input. Event ${inEvent} was not stopped.`,
        displayError: `Invalid input. Event ${inEvent} was not stopped.`,
      });
      return;
    }

    // Build events payload
    const eventDataArray: {
      time: number;
      action: EventAction;
      position: Position;
      points: number;
      scoutReportUuid: string;
    }[] = [];

    for (const event of events) {
      let points = 0;
      const time = event[0];
      const action = EventActionMap[event[1]];
      const position = PositionMap[event[2]];
      if (action === EventAction.STOP_SCORING) {
        points = event[3];
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

    const broke = paramsScoutReport.robotBrokeDescription?.trim();
    if (broke) {
      sendWarningToSlack(
        "BREAK",
        matchRow.matchNumber,
        matchRow.teamNumber,
        matchRow.tournamentKey,
        paramsScoutReport.uuid,
      );
    }

    await prismaClient.event.createMany({ data: eventDataArray });
    await totalPointsScoutingLead(req.user, { scoutReportUuid });
    res.status(200).send("done adding data");
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).send({
        error: z.prettifyError(error),
        displayError:
          "Invalid input. Make sure you are using the correct input.",
      });
      return;
    } else if (error instanceof PrismaClientKnownRequestError) {
      res.status(400).send({
        error: `The scout report with the same uuid already exists.`,
        displayError: "Scout report already uploaded",
      });
      return;
    } else if (error instanceof PrismaClient.NotFoundError) {
      res.status(400).send({
        error: `This scouter has been deleted or never existed.`,
        displayError:
          "This scouter has been deleted. Reset your settings and choose a new scouter.",
      });
      return;
    }

    console.log(error);
    res.status(500).send({ error: error, displayError: "Error" });
  }
};
