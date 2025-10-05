import { Response } from "express";
import prismaClient from "../../prismaClient";
import z from "zod";
import { createHash } from "crypto";
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";

export const revokeApiKey = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    if (req.tokenType === "apiKey") {
    res.status(403).json({ error: "Cannot create API key using an API key" });
    return;
  }
    const paramsAddApiKey = z.object({
        key: z.string()
    }).parse(req.query);

    const hashedKey = createHash('sha256').update(paramsAddApiKey.key).digest('hex');

    const key = await prismaClient.apiKey.deleteMany({
      where: { keyHash: hashedKey },
    });

    if (!key) {
      res.status(404).json({ error: "Key not found" });
      return;
    }

    res.status(200).json("Key successfully revoked");
    return;


  } catch (error) {
    res.status(400).json({ error: "Invalid request parameters" });
    return;
  }
};