import { Response } from "express";
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth.js";
import {
  dataSourceRuleSchema,
  dataSourceRuleToArray,
} from "../analysis/dataSourceRule.js";
import z from "zod";
import { allTeamNumbers } from "../analysis/analysisConstants.js";

export const getTeamSource = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const teamSourceRule = dataSourceRuleSchema(z.number()).parse(
      req.user.teamSourceRule,
    );

    if (
      teamSourceRule.mode === "INCLUDE" &&
      teamSourceRule.items[0] === req.user.teamNumber &&
      teamSourceRule.items.length === 1
    ) {
      res.status(200).send("THIS_TEAM");
      return;
    }
    if (
      teamSourceRule.mode === "EXCLUDE" &&
      teamSourceRule.items.length === 0
    ) {
      res.status(200).send("ALL_TEAMS");
      return;
    } else {
      res
        .status(200)
        .send(dataSourceRuleToArray(teamSourceRule, await allTeamNumbers));
    }
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};
