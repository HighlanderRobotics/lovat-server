import { Request, Response } from "express";
import prismaClient from "../../../prismaClient.js";
import z from "zod";
import { PositionMap, EventActionMap } from "../managerConstants.js";
import { addTournamentMatches } from "../addTournamentMatches.js";
import {
  AutoClimb,
  Beached,
  EventAction,
  FeederType,
  IntakeType,
  Mobility,
  Position,
  MatchType,
  RobotRole,
  ClimbPosition,
  ClimbSide,
  EndgameClimb,
} from "@prisma/client";
import { sendWarningToSlack } from "../../slack/sendWarningNotification.js";
import { invalidateCache } from "../../../lib/clearCache.js";

export const addScoutReport = async (
  req: Request,
  res: Response
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

    // Make sure UUID does not already exist in database
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

    // Check that scouter exists
    const scouter = await prismaClient.scouter.findFirst({
      where: {
        uuid: paramsScoutReport.scouterUuid,
      },
    });
    if (!scouter) {
      res.status(400).send({
        error: `This ${paramsScoutReport.scouterUuid} has been deleted or never existed.`,
        displayError:
          "This scouter has been deleted. Reset your settings and choose a new scouter.",
      });
      return;
    }

    // Add tournament matches if they dont exist
    const tournamentMatchRows = await prismaClient.teamMatchData.findMany({
      where: {
        tournamentKey: paramsScoutReport.tournamentKey,
      },
    });
    if (tournamentMatchRows === null || tournamentMatchRows.length === 0) {
      await addTournamentMatches(paramsScoutReport.tournamentKey);
    }

    // Get key for relevant TeamMatchData
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

    // Create scout report in database
    await prismaClient.scoutReport.create({
      data: {
        // constants
        uuid: paramsScoutReport.uuid,
        startTime: new Date(paramsScoutReport.startTime),
        teamMatchData: { connect: { key: matchKey } },
        scouter: { connect: { uuid: paramsScoutReport.scouterUuid } },
        notes: paramsScoutReport.notes,
        robotRoles: paramsScoutReport.robotRoles,
        driverAbility: paramsScoutReport.driverAbility,
        robotBrokeDescription: paramsScoutReport.robotBrokeDescription ?? null,

        // game specific
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

    // Collect all affected cached analyses
    invalidateCache(
      paramsScoutReport.teamNumber,
      paramsScoutReport.tournamentKey
    );

    const scoutReportUuid = paramsScoutReport.uuid;

    const eventDataArray: {
      time: number;
      action: EventAction;
      position: Position;
      points: number;
      scoutReportUuid: string;
    }[] = [];
    const events = req.body.events;

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

    if (paramsScoutReport.robotBrokeDescription != null || undefined) {
      sendWarningToSlack(
        "BREAK",
        matchRow.matchNumber,
        matchRow.teamNumber,
        matchRow.tournamentKey,
        paramsScoutReport.uuid
      );
    }

    // Push event rows to prisma database
    const rows = await prismaClient.event.createMany({
      data: eventDataArray,
    });

    res.status(200).send("done adding data");
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).send({
        error: z.prettifyError(error),
        displayError:
          "Invalid input. Make sure you are using the correct input.",
      });
      return;
    }

    console.log(error);
    res.status(500).send({ error: error, displayError: "Error" });
  }
};
