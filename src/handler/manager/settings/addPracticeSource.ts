import { Response } from "express";
import prismaClient from "../../../prismaClient.js";
import z from "zod";
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth.js";

export const addPracticeSource = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const user = req.user;

    const params = z
      .object({
        includePracticeMatches: z.boolean(),
      })
      .parse(req.body);
    await prismaClient.user.update({
      where: {
        id: user.id,
      },
      data: {
        includePracticeMatches: params.includePracticeMatches,
      },
    });
    res.status(200).send("Settings successfully updated");
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};
