import { Response } from "express";
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";
import {
  dataSourceRuleSchema,
  dataSourceRuleToArray,
} from "../analysis/analysisHandler";
import { allTeamNumbers, allTournaments } from "../analysis/analysisConstants";
import z from "zod";

export const getTournamentSource = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    res
      .status(200)
      .send(
        dataSourceRuleToArray(
          dataSourceRuleSchema(z.string()).parse(req.user.tournamentSourceRule),
          await allTournaments,
        ),
      );
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};
