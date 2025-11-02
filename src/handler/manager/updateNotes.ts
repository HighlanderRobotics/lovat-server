import { Response } from "express";
import prismaClient from "../../prismaClient";
import z from "zod";
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";

export const updateNotes = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const params = z
      .object({
        note: z.string(),
        uuid: z.string(),
      })
      .safeParse({
        note: req.body.note,
        uuid: req.params.uuid,
      });
    if (!params.success) {
      res.status(400).send(params);
      return;
    }

    if (req.user.role !== "SCOUTING_LEAD") {
      res.status(403).send("Not authorized to edit this note");
      return;
    }
    const row = await prismaClient.scoutReport.update({
      where: {
        uuid: req.params.uuid,
        scouter: {
          sourceTeamNumber: req.user.teamNumber,
        },
      },
      data: {
        notes: params.data.note,
      },
      include: {
        teamMatchData: true,
      },
    });
    await prismaClient.cachedAnalysis.deleteMany({
      where: {
        teamDependencies: {
          has: row.teamMatchData.teamNumber,
        },
        tournamentDependencies: {
          has: row.teamMatchData.tournamentKey,
        },
      },
    });
    if (!row) {
      res.status(403).send("Not authorized to update this picklist");
      return;
    }
    res.status(200).send("Note updated");
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};
