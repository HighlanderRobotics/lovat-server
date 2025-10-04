import { Response } from "express";
import prismaClient from "../../prismaClient";
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";

export const getTeamSource = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    if (
      req.user.teamSource.length === 1 &&
      req.user.teamSource[0] === req.user.teamNumber
    ) {
      res.status(200).send("THIS_TEAM");
      return;
    }
    const team = await prismaClient.team.findMany();
    if (req.user.teamSource.length === team.length) {
      res.status(200).send("ALL_TEAMS");
      return;
    } else {
      res.status(200).send(req.user.teamSource);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};
