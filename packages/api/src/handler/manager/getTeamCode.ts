import { Response } from "express";
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";

import { db } from "../../db";
import { eq } from "drizzle-orm";
import { registeredTeam } from "../../db/schema";

export const getTeamCode = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user;

    if (user.role !== "SCOUTING_LEAD") {
      res.status(403).send("Not authorized to get the team code");
      return;
    }

    const team = await db.query.registeredTeam.findFirst({
      where: eq(registeredTeam.number, user.teamNumber),
    });

    if (team.teamApproved && team.emailVerified) {
      res.status(200).send(team.code);
      return;
    } else {
      //change to team email or website not approved if we do the 2 step verification
      res.status(400).send({
        error: "team email not approved",
        displayError: "team email not approved",
      });
      return;
    }
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};
