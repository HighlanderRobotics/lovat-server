import { Response } from "express";
import prismaClient from "@/src/prismaClient.js";
import z from "zod";
import { AuthenticatedRequest } from "@/src/lib/middleware/requireAuth.js";

export const addMutablePicklist = async (
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
        tournamentKey: z.string().optional(),
      })
      .safeParse({
        name: req.body.name,
        teams: req.body.teams,
        authorId: user.id,
        tournamentKey: req.body.tournamentKey,
      });

    if (!params.success) {
      res.status(400).send(params);
      return;
    }
    if (req.user.teamNumber === null) {
      res
        .status(403)
        .send(
          "Not authortized to publish a picklist because your not on a team",
        );
      return;
    }
    await prismaClient.mutablePicklist.create({
      data: {
        name: params.data.name,
        teams: params.data.teams,
        authorId: params.data.authorId,
        tournamentKey: params.data.tournamentKey,
      },
    });
    res.status(200).send("mutable picklist added");
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};
