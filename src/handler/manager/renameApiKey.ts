import { Response } from "express";
import prismaClient from "../../prismaClient";
import z from "zod";
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";

export const renameApiKey = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    if (req.tokenType === "apiKey") {
      res.status(403).json({ error: "Cannot rename API key using an API key" });
      return;
    }

    const paramsRenameApiKey = z
      .object({
        uuid: z.string(),
        newName: z.string(),
      })
      .parse(req.query);

    const row = await prismaClient.apiKey.findFirst({
      where: {
        uuid: paramsRenameApiKey.uuid,
      },
      select: {
        user: true
      }
    });

    if (row.user.id !== req.user.id ) {
      if (req.user.role == "SCOUTING_LEAD" && row.user.teamNumber == req.user.teamNumber) {
        await prismaClient.apiKey.update({
          where: { uuid: paramsRenameApiKey.uuid },
          data: { name: paramsRenameApiKey.newName },
        });
        res.status(200).json("Key successfully renamed");
        return;
      } else {
        res
          .status(403)
          .json({ error: "You do not have permission to rename this API key" });
        return;
      }
    } else {
      await prismaClient.apiKey.update({
        where: { uuid: paramsRenameApiKey.uuid },
        data: { name: paramsRenameApiKey.newName },
      });

      res.status(200).json("Key successfully renamed");
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
