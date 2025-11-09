import { Response } from "express";
import prismaClient from "../../prismaClient";
import z from "zod";
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";

import { arrayToRule } from "../../lib/migrateDataSources";
import { allTeamNumbers, allTournaments } from "../analysis/analysisConstants";

export const updateSettings = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const params = z
      .object({
        teamSource: z.array(z.number()),
        tournamentSource: z.array(z.string()),
      })
      .parse(req.body);

    await prismaClient.user.update({
      where: {
        id: req.user.id,
      },
      data: {
        teamSourceRule: arrayToRule(params.teamSource, await allTeamNumbers),
        tournamentSourceRule: arrayToRule(
          params.tournamentSource,
          await allTournaments,
        ),
      },
    });
    res.status(200).send("Settings successfully updated");
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid request parameters" });
      return;
    }
    console.error(error);
    res.status(500).send("Error in updating settings");
  }
};
