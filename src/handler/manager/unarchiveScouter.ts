import prismaClient from "../../prismaClient.js";
import z from "zod";
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth.js";
import { UserRole }from "../../generated/prisma/client.js";
import { Response } from "express";

export const unarchiveScouter = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const params = z
      .object({
        uuid: z.string(),
      })
      .parse(req.params);

    if (req.user.role !== UserRole.SCOUTING_LEAD) {
      res
        .status(403)
        .send("You need to be a scouting lead to unarchive scouters");
      return;
    }

    await prismaClient.scouter.update({
      where: {
        uuid: params.uuid,
      },
      data: {
        archived: false,
      },
    });

    res.status(200).send("done unarchiving scouter");
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid request parameters" });
      return;
    }
    console.error(error);
    res.status(500).send({ error: error, displayError: "Error" });
  }
};
