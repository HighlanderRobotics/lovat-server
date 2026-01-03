import { Response } from "express";
import prismaClient from "@/src/prismaClient.js";
import { AuthenticatedRequest } from "@/src/lib/middleware/requireAuth.js";

export const getTeamCode = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const user = req.user;

    if (user.role !== "SCOUTING_LEAD") {
      res.status(403).send("Not authorized to get the team code");
      return;
    }
    const row = await prismaClient.registeredTeam.findUnique({
      where: {
        number: user.teamNumber,
      },
    });
    if (row.teamApproved && row.emailVerified) {
      res.status(200).send(row.code);
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
