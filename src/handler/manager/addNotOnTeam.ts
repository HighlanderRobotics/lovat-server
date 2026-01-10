import { Response } from "express";
import prismaClient from "../../prismaClient.js";
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth.js";

export const addNotOnTeam = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const user = await prismaClient.user.update({
      where: {
        id: req.user.id,
      },
      data: {
        teamNumber: null,
        role: "ANALYST",
      },
    });
    res.status(200).send(user);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: error, displayError: "Error" });
  }
};
