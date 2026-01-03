import { Response } from "express";
import prismaClient from "@/src/prismaClient.js";
import z from "zod";
import { AuthenticatedRequest } from "@/src/lib/middleware/requireAuth.js";

export const getSingleMutablePicklist = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const user = req.user;

    const params = z
      .object({
        uuid: z.string(),
      })
      .safeParse({
        uuid: req.params.uuid,
      });
    if (!params.success) {
      res.status(400).send(params);
      return;
    }
    const row = await prismaClient.mutablePicklist.findUnique({
      where: {
        author: {
          teamNumber: user.teamNumber,
        },
        uuid: params.data.uuid,
      },
    });

    res.status(200).send(row);
  } catch (error) {
    console.error(error);
    console.error("failed mutable picklist");
    res.status(500).send(error);
  }
};
