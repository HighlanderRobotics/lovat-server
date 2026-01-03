import { Response } from "express";
import prismaClient from "../../prismaClient.js";
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth.js";

export const getUsers = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    //gets all users on the team
    const user = req.user;
    if (user.teamNumber === null) {
      //no users because they are not affilated with a team
      res.status(200).send([]);
    } else {
      const users = await prismaClient.user.findMany({
        where: {
          teamNumber: user.teamNumber,
        },
        select: {
          teamNumber: true,
          username: true,
          email: true,
          id: true,
        },
      });
      res.status(200).send(users);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};
