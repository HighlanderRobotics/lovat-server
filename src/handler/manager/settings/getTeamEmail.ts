import { Response } from "express";
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth.js";
import {
  dataSourceRuleSchema,
  dataSourceRuleToArray,
} from "../../analysis/dataSourceRule.js";
import z from "zod";
import { allTeamNumbers } from "../../analysis/analysisConstants.js";
import prismaClient from "../../../prismaClient.js";

export const getTeamEmail = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    if (req.user.role !== "SCOUTING_LEAD") {
      res.status(403).send("Forbidden");
      return;
    }

    const teamEmail = await prismaClient.registeredTeam.findUnique({
      where: { number: req.user.teamNumber },
      select: { email: true },
    });

    if (!teamEmail) {
      res.status(404).send("Team email not found");
      return;
    }

    res.status(200).send(teamEmail.email);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};
