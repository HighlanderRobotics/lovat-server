import { Response } from "express";
import prismaClient from "../../../prismaClient.js";
import z from "zod";
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth.js";
import { UserRole } from "@prisma/client";

export const getScoutReport = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const params = z
      .object({
        uuid: z.string(),
      })
      .safeParse({
        uuid: req.params.uuid,
      });

    if (!params.success) {
      res.status(400).send(params);
      return;
    }
    const scoutReport = await prismaClient.scoutReport.findUnique({
      where: {
        uuid: params.data.uuid,
      },
      include: {
        scouter: {
          select: {
            name: true,
            sourceTeamNumber: true,
          },
        },
      },
    });

    if (!scoutReport) {
      res.status(404).send("Cannot find scout report");
      return;
    }

    const events = await prismaClient.event.findMany({
      where: {
        scoutReportUuid: req.params.uuid,
      },
    });

    const user = req.user;
    const isOnSameTeam =
      user.teamNumber !== null &&
      scoutReport.scouter.sourceTeamNumber === user.teamNumber;

    const canModify = isOnSameTeam && user.role === UserRole.SCOUTING_LEAD;

    const { scouter, ...reportWithoutScouter } = scoutReport;
    const responseReport = {
      ...reportWithoutScouter,
      scouterName: isOnSameTeam ? scouter.name : undefined,
    };

    res
      .status(200)
      .send({ scoutReport: responseReport, events: events, canModify });
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};
