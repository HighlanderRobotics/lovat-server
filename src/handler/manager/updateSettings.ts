import { Response } from "express";
import prismaClient from "../../prismaClient";
import z from "zod";
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";
import { dataSourceRuleSchema } from "../analysis/analysisHandler";
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

    if (!params) {
      res.status(400).send(params);
      return;
    }

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
    res.status(200).send("Settings sucsessfully updated");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error in deleting data");
  }
};
