import { Response } from "express";
import prismaClient from "../../prismaClient.js";
import z from "zod";
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth.js";
import { UserRole }from "../../generated/prisma/client.js";

export const renameApiKey = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    if (req.tokenType === "apiKey") {
      res.status(403).json({ error: "Cannot rename API key using an API key" });
      return;
    }

    const params = z
      .object({
        uuid: z.string(),
        newName: z.string(),
      })
      .parse(req.query);

    const keyRow = await prismaClient.apiKey.findFirst({
      where: {
        uuid: params.uuid,
      },
      select: {
        user: true,
      },
    });

    if (
      req.user.id === keyRow.user.id ||
      (req.user.teamNumber === keyRow.user.teamNumber &&
        req.user.role === UserRole.SCOUTING_LEAD)
    ) {
      await prismaClient.apiKey.update({
        where: { uuid: params.uuid },
        data: { name: params.newName },
      });

      res.status(200).json("Key successfully renamed");
      return;
    } else {
      res
        .status(403)
        .json({ error: "You do not have permission to rename this API key" });
      return;
    }
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
