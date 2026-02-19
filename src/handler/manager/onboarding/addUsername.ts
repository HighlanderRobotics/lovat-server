import { Response } from "express";
import prismaClient from "../../../prismaClient.js";
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth.js";

export const addUsername = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    if (req.tokenType === "apiKey") {
      res.status(403).json({ error: "This action cannot be performed using an API key" });
      return;
    }

    const user = req.user;

    await prismaClient.user.update({
      where: {
        id: user.id,
      },
      data: {
        username: String(req.body.username),
      },
    });
    res.status(200).send("username added");
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};
