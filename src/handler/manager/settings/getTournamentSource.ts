import { Response } from "express";
import { AuthenticatedRequest } from "@/src/lib/middleware/requireAuth.js";
import {
  dataSourceRuleSchema,
  dataSourceRuleToArray,
} from "@/src/handler/analysis/dataSourceRule.js";
import { allTournaments } from "@/src/handler/analysis/analysisConstants.js";
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
