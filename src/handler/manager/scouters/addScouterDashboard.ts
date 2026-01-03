import { Response } from "express";
import prismaClient from "@/src/prismaClient.js";
import z from "zod";
import { AuthenticatedRequest } from "@/src/lib/middleware/requireAuth.js";

export const addScouterDashboard = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const params = z
      .object({
        name: z.string(),
      })
      .safeParse({
        name: req.body.name,
      });
    if (!params.success) {
      res.status(400).send(params);
      return;
    }
    if (req.user.role !== "SCOUTING_LEAD" || req.user.teamNumber === null) {
      res.status(403).send("Not authorized to make a scouter");
      return;
    }
    await prismaClient.scouter.create({
      data: {
        name: params.data.name,
        sourceTeamNumber: req.user.teamNumber,
      },
    });
    res.status(200).send("Scouter added");
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};
