import { Response } from "express";
import prismaClient from "../../prismaClient";
import z from "zod";
import { createHash, randomBytes } from "crypto";
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";

export const addApiKey = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  if (req.tokenType === "apiKey") {
    res.status(403).json({ error: "Cannot create API key using an API key" });
    return;
  }
  try {
    const paramsAddApiKey = z
      .object({
        name: z.string(),
      })
      .parse(req.query);

    const user = req.user;

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const apiKey = `lvt-${randomBytes(32).toString("hex")}`;

    await prismaClient.apiKey.create({
      data: {
        keyHash: createHash("sha256").update(apiKey).digest("hex"),
        name: paramsAddApiKey.name,
        userId: user.id,
      },
    });

    res.status(200).json({ apiKey: apiKey });
    return;
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
