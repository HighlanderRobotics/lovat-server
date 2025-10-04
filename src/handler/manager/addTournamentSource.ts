import { Response } from "express";
import prismaClient from "../../prismaClient";
import z from "zod";
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";

export const addTournamentSource = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const user = req.user;

    const params = z
      .object({
        tournamentSource: z.array(z.string()),
      })
      .safeParse({
        tournamentSource: req.body.tournaments,
      });

    if (!params.success) {
      res.status(400).send(params);
      return;
    }
    await prismaClient.user.update({
      where: {
        id: user.id,
      },
      data: {
        tournamentSource: params.data.tournamentSource,
      },
    });
    res.status(200).send("tournament sources added");
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};
