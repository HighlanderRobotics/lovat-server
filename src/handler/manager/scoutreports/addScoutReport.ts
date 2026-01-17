import { Request, Response } from "express";
import prismaClient from "../../../prismaClient.js";
import z from "zod";
import {
  PositionMap,
  MatchTypeMap,
  RobotRoleMap,
  EventActionMap,
} from "../managerConstants.js";
import { addTournamentMatches } from "../addTournamentMatches.js";
import {
  AutoClimbResult,
  BeachedStatus,
  EndgameClimbResult,
  EventAction,
  FeederType,
  FieldTraversal,
  IntakeType,
  Position,
} from "@prisma/client";
import { MatchType, RobotRole } from "@prisma/client";
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
        robotRole: z.nativeEnum(RobotRole),
        autoClimbResult: z.nativeEnum(AutoClimbResult),
        endgameClimbResult: z.nativeEnum(EndgameClimbResult),
        fieldTraversal: z.nativeEnum(FieldTraversal),
        beachedStatus: z.nativeEnum(BeachedStatus),
        feederType: z.nativeEnum(FeederType),
        intakeType: z.nativeEnum(IntakeType),
        robotBrokeDescription: z
          .union([z.string(), z.null(), z.undefined()])
          .optional(),
        driverAbility: z.number(),
        shootingAccuracy: z.number(),
        defenseEffectiveness: z.number(),
        scoringWhileMoving: z.boolean(),
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
        //constants
        uuid: paramsScoutReport.uuid,
        startTime: new Date(paramsScoutReport.startTime),
        teamMatchData: { connect: { key: matchKey } },
        scouter: { connect: { uuid: paramsScoutReport.scouterUuid } },
        notes: paramsScoutReport.notes,
        robotRole: paramsScoutReport.robotRole,
        driverAbility: paramsScoutReport.driverAbility,
        robotBrokeDescription: paramsScoutReport.robotBrokeDescription ?? null,

        //game specfific
        autoClimbResult: paramsScoutReport.autoClimbResult,
        endgameClimbResult: paramsScoutReport.endgameClimbResult,
        fieldTraversal: paramsScoutReport.fieldTraversal,
        beachedStatus: paramsScoutReport.beachedStatus,
        feederType: paramsScoutReport.feederType,
        intakeType: paramsScoutReport.intakeType,
        defenseEffectiveness: paramsScoutReport.defenseEffectiveness,
        scoringWhileMoving: paramsScoutReport.scoringWhileMoving,
        shootingAccuracy: paramsScoutReport.shootingAccuracy,
      },
    });

    // Collect all affected cached analyses
    invalidateCache(
      paramsScoutReport.teamNumber,
      paramsScoutReport.tournamentKey
    );

    const scoutReportUuid = paramsScoutReport.uuid;

    const eventDataArray = [];
    const events = req.body.events;

    let doesLeave = false;

    for (const event of events) {
      let points = 0;
      const time = event[0];
      const action = EventActionMap[event[1]];
      const position = PositionMap[event[2]];
      if (time <= 18) {
        if (action === EventAction.STOP_SCORING) {
          points = Number(action[3]);
        } else if (action === EventAction.CLIMB) {
          points = 15;
        }
      } else {
        if (action === EventAction.STOP_SCORING) {
          points = Number(action[3]);
        }
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

    //recalibrate the max reasonable points for every year
    //uncomment for scouting lead

    // const totalPoints = await totalPointsScoutingLead(scoutReportUuid)
    // if (totalPoints === 0 || totalPoints > 80) {
    //     await prismaClient.flaggedScoutReport.create({
    //         data:
    //         {
    //             note: `${totalPoints} recorded, not including endgame`,
    //             scoutReportUuid: scoutReportUuid
    //         }
    //     })
    // }
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
