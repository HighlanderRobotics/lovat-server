import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "./requireAuth";
import prisma from "../../prismaClient";
import { kv } from "../../redisClient";

export const requireVerifiedTeam = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const teamNumber = req.user.teamNumber;

    let teamVerified: boolean =
      (await kv.get(`auth:team:${teamNumber}`)) !== null;

    if (!teamVerified) {
      teamVerified =
        (
          await prisma.registeredTeam.findUnique({
            where: {
              number: teamNumber,
            },
          })
        )?.emailVerified ?? false;

      if (teamVerified) await kv.set(`auth:team:${teamNumber}`, "verified");
    }
    if (!teamVerified) {
      res.status(403).send("Your team has not been verified yet");
      return;
    }

    next();
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error");
  }
};
