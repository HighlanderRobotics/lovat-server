import { Response } from "express";
import prismaClient from "../../prismaClient";
import z from "zod";
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";
import { allTournaments } from "../analysis/analysisConstants";
import { arrayToRule } from "../../lib/migrateDataSources";

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
        tournamentSourceRule: arrayToRule<string>(params.data.tournamentSource, await allTournaments),
      },
    });
    res.status(200).send("tournament sources added");
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};
