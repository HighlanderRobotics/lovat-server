import { Response } from "express";
import prismaClient from "../../prismaClient";
import z from "zod";
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";

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
    const apiKey = await prismaClient.apiKey.findMany({
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

    res.status(200).json({apiKeys : apiKey});
    return;

  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid request parameters", details: error.errors });
      return;
    }
    res.status(500).json({ error: "Internal server error",});
    console.error(error);
    return;
  }
};