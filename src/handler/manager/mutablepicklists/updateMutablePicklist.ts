import { Response } from "express";
import prismaClient from "../../../prismaClient.js";
import z from "zod";
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth.js";

export const updateMutablePicklist = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const user = req.user;

    const params = z
      .object({
        name: z.string(),
        teams: z.array(z.number().min(0)),
        authorId: z.string(),
      })
      .safeParse({
        name: req.body.name,
        teams: req.body.teams,
        authorId: user.id,
      });
    if (!params.success) {
      res.status(400).send(params);
      return;
    }

    const row = await prismaClient.mutablePicklist.update({
      where: {
        uuid: req.params.uuid,
        author: {
          teamNumber: user.teamNumber,
        },
      },
      data: {
        name: params.data.name,
        teams: params.data.teams,
        authorId: params.data.authorId,
      },
    });
    if (!row) {
      res.status(403).send("Not authorized to update this picklist");
      return;
    }

    res.status(200).send("mutable picklist updated");
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};
