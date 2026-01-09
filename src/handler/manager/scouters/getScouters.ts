import { Response } from "express";
import prismaClient from "../../../prismaClient.js";
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth.js";
import z from "zod";

export const getScouters = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const params = z
      .object({
        archived: z
          .string()
          .transform((val) => val === "true")
          .optional(),
      })
      .parse(req.query);

    if (req.user.teamNumber === null) {
      res.status(403).send("User is not affilated with a team");
      return;
    }
    const rows = await prismaClient.scouter.findMany({
      where: {
        sourceTeamNumber: req.user.teamNumber,
        archived: params.archived,
      },
      select: {
        uuid: true,
        name: true,
      },
    });

    res.status(200).send(rows);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};
