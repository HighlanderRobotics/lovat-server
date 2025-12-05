import { Response } from "express";
import prismaClient from "../../prismaClient";
import z from "zod";
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";
import { invalidateCache } from "../../lib/clearCache";

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
    if (!row) {
      res.status(403).send("Not authorized to update this picklist");
      return;
    }
    invalidateCache(
      row.teamMatchData.teamNumber,
      row.teamMatchData.tournamentKey,
    );

    res.status(200).send("Note updated");
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid request parameters" });
      return;
    }
    console.error(error);
    res.status(500).send(error);
  }
};
