import { Response } from "express";
import prismaClient from "../../prismaClient.js";
import z from "zod";
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth.js";
import { sendVerificationEmail } from "./resendEmail.js";

export const updateTeamEmail = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const params = z
      .object({
        email: z.string().email(),
      })
      .parse(req.query);

    const teamRow = await prismaClient.registeredTeam.findUnique({
      where: {
        number: req.user.teamNumber,
      },
    });

    if (teamRow === null) {
      res.status(404).send("team not found");
    }

    sendVerificationEmail(params.email, req.user.teamNumber);

    res.status(200).send("verification email sent");
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid request parameters" });
    }
    console.error(error);
    res.status(500).send("Error in deleting data");
  }
};
