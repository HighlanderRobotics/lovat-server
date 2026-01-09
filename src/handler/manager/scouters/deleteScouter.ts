import { Response } from "express";
import prismaClient from "../../../prismaClient.js";
import z from "zod";
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth.js";
import { invalidateCache } from "../../../lib/clearCache.js";

export const deleteScouter = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const user = req.user;
    const params = z
      .object({
        uuid: z.string(),
      })
      .safeParse({
        uuid: req.body.scouterUuid,
      });
    if (!params.success) {
      res.status(400).send(params);
      return;
    }
    if (user.teamNumber === null) {
      res
        .status(404)
        .send("The user sending this request is not affilated with a team");
      return;
    }
    const scouter = await prismaClient.scouter.findUnique({
      where: {
        uuid: params.data.uuid,
      },
    });
    if (scouter === null) {
      res
        .status(404)
        .send(
          "The scouter that you are trying to change the name of does not exist",
        );
      return;
    }
    if (
      user.role !== "SCOUTING_LEAD" ||
      user.teamNumber !== scouter.sourceTeamNumber
    ) {
      res
        .status(403)
        .send("Not authorized to update the name of the given scouter");
      return;
    }
    const scouterRow = await prismaClient.scouter.delete({
      where: {
        uuid: params.data.uuid,
      },
      include: {
        team1Shifts: true,
        team2Shifts: true,
        team3Shifts: true,
        team4Shifts: true,
        team5Shifts: true,
        team6Shifts: true,
        scoutReports: {
          include: {
            teamMatchData: true,
          },
        },
      },
    });
    const deletedScouterUuid = params.data.uuid;
    //remove from scouter shifts
    const shiftsToUpdate = await prismaClient.scouterScheduleShift.findMany({
      where: {
        OR: [
          { team1: { some: { uuid: deletedScouterUuid } } },
          { team2: { some: { uuid: deletedScouterUuid } } },
          { team3: { some: { uuid: deletedScouterUuid } } },
          { team4: { some: { uuid: deletedScouterUuid } } },
          { team5: { some: { uuid: deletedScouterUuid } } },
          { team6: { some: { uuid: deletedScouterUuid } } },
        ],
      },
    });
    for (const shift of shiftsToUpdate) {
      const updatePayload = {};

      for (let teamIndex = 1; teamIndex <= 6; teamIndex++) {
        const teamKey = `team${teamIndex}`;
        if (
          shift[teamKey].some((scouter) => scouter.uuid === deletedScouterUuid)
        ) {
          updatePayload[teamKey] = {
            disconnect: [{ uuid: deletedScouterUuid }],
          };
        }
      }

      if (Object.keys(updatePayload).length > 0) {
        await prismaClient.scouterScheduleShift.update({
          where: { uuid: shift.uuid },
          data: updatePayload,
        });
      }
    }

    const teamsScouted: number[] = scouterRow.scoutReports.map(
      (report) => report.teamMatchData.teamNumber,
    );
    const tournamentsScouted: string[] = scouterRow.scoutReports.map(
      (report) => report.teamMatchData.tournamentKey,
    );

    invalidateCache(teamsScouted, tournamentsScouted);

    res.status(200).send("Scouter deleted");
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};
