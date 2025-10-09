import { Response } from "express";
import prismaClient from "../../prismaClient";
import z from "zod";
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";

export const revokeApiKey = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    if (req.tokenType === "apiKey") {
      res.status(403).json({ error: "Cannot revoke API key using an API key" });
      return;
    }
    const paramsRevokeApiKey = z
      .object({
        uuid: z.string(),
      })
      .parse(req.query);

    if (
      !(await prismaClient.apiKey.findFirst({
        where: { uuid: paramsRevokeApiKey.uuid, userId: req.user?.id },
      }))
    ) {
      if (
        (await prismaClient.apiKey.findFirst({
          where: {
            uuid: paramsRevokeApiKey.uuid,
            user: {
              teamNumber: req.user?.teamNumber,
              NOT: { id: req.user?.id },
            },
          },
        })) &&
        req.user?.role == "SCOUTING_LEAD"
      ) {
        await prismaClient.apiKey.delete({
          where: { uuid: paramsRevokeApiKey.uuid },
        });
        res.status(200).json("Key successfully revoked");
        return;
      } else {
        res
          .status(403)
          .json({ error: "You do not have permission to revoke this API key" });
        return;
      }
    } else {
      await prismaClient.apiKey.delete({
        where: { uuid: paramsRevokeApiKey.uuid },
      });

      res.status(200).json("Key successfully revoked");
      return;
    }
  } catch (error) {
    res.status(400).json({ error: "Invalid request parameters" });
    return;
  }
};
