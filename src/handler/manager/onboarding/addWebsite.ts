import { Response } from "express";
import prismaClient from "../../../prismaClient.js";
import z from "zod";
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth.js";
import { sendSlackVerification } from "../sendSlackVerification.js";

export const addWebsite = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    if (req.tokenType === "apiKey") {
      res.status(403).json({ error: "This action cannot be performed using an API key" });
      return;
    }

    const user = req.user;

    const WebsiteSchema = z.object({
      website: z.string(),
    });

    const currWebsite = { website: req.body.website };
    const possibleTypeErrorShift = WebsiteSchema.safeParse(currWebsite);
    if (!possibleTypeErrorShift.success) {
      res.status(400).send(possibleTypeErrorShift);
      return;
    }
    const row = await prismaClient.registeredTeam.update({
      where: {
        number: user.teamNumber,
      },
      data: currWebsite,
    });

    await sendSlackVerification(row.number, row.email, req.body.website);
    res.status(200).send("Slack verification sent");
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};
