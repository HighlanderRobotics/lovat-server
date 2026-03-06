import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "./requireAuth.js";
import prisma from "../../prismaClient.js";
import { kv } from "../../redisClient.js";

export const requireVerifiedTeam = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user || !req.user.teamNumber) {
      res.status(401).send("No team");
      return;
    }
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
