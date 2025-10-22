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

    const apiKeys = await prismaClient.apiKey.findMany({
      where: {
        OR: [
          { user: { teamNumber: req.user.teamNumber } },
          { userId: req.user.id },
        ],
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

    const myKeys = apiKeys.filter((key) => key.user.username === user.username);

    const teamKeys = apiKeys.filter(
      (key) => key.user.username !== user.username,
    );

    if (user.role === UserRole.SCOUTING_LEAD) {
      res.status(200).json({ apiKeys: myKeys, teamApiKeys: teamKeys });
      return;
    }

    res.status(200).json({ apiKeys: myKeys });
    return;
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid request parameters" });
      return;
    }
    res.status(500).json({ error: "Internal server error" });
    console.error(error);
    return;
  }
};
