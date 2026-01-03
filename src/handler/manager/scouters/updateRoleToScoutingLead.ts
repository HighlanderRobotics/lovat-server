import { Response } from "express";
import prismaClient from "@/src/prismaClient.js";
import z from "zod";
import { AuthenticatedRequest } from "@/src/lib/middleware/requireAuth.js";

export const updateRoleToScoutingLead = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const user = req.user;
    const params = z
      .object({
        upgradedUserId: z.string(),
      })
      .safeParse({
        upgradedUserId: req.body.user,
      });
    if (!params.success) {
      res.status(400).send(params);
      return;
    }
    if (user.teamNumber === null) {
      res
        .status(404)
        .send("The user sending this request is not affilated with a team");
      return;
    }
    const upgradingUser = await prismaClient.user.findUnique({
      where: {
        id: params.data.upgradedUserId,
      },
    });
    if (upgradingUser === null) {
      res
        .status(404)
        .send("The user that you are trying to upgrade does not exist");
      return;
    }
    if (user.id === params.data.upgradedUserId) {
      res.status(200).send("The user you are trying to upgrade is yourself");
      return;
    }
    if (
      user.role !== "SCOUTING_LEAD" ||
      user.teamNumber !== upgradingUser.teamNumber
    ) {
      res.status(403).send("Not authorized to upgrade the given user");
      return;
    }

    await prismaClient.user.update({
      where: {
        id: params.data.upgradedUserId,
      },
      data: {
        role: "SCOUTING_LEAD",
      },
    });

    res.status(200).send("user role updated to scouting lead");
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};
