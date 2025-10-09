import { Response } from "express";
import prismaClient from "../../prismaClient";
import z from "zod";
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";
import { UserRole } from "@prisma/client";

export const getApiKeys = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const apiKeys = await prismaClient.apiKey.findMany({
      where: {
        userId: user.id,
      },
      select: {
        uuid: true,
        name: true,
        createdAt: true,
        lastUsed: true,
        requests: true,
      },
    });

    if (user.role === UserRole.SCOUTING_LEAD) {
      const teamApiKeys = await prismaClient.apiKey.findMany({
        where: {
          user: {
            teamNumber: user.teamNumber,
          },
          NOT: {
            userId: user.id,
          },
        },
        select: {
          uuid: true,
          name: true,
          createdAt: true,
          lastUsed: true,
          requests: true,
          user: {
            select: {
              username: true,
            },
          },
        },
      });
      res.status(200).json({ apiKeys: apiKeys, teamApiKeys: teamApiKeys });
      return;
    }

    res.status(200).json({ apiKeys: apiKeys });
    return;
  } catch (error) {
    if (error instanceof z.ZodError) {
      res
        .status(400)
        .json({ error: "Invalid request parameters", details: error.errors });
      return;
    }
    res.status(500).json({ error: "Internal server error" });
    console.error(error);
    return;
  }
};
