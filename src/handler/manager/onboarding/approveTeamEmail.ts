import { Request, Response } from "express";
import prismaClient from "../../../prismaClient.js";
import z from "zod";
import { Prisma } from "@prisma/client";
const { PrismaClientKnownRequestError } = Prisma;
import { kv } from "../../../redisClient.js";

export const approveTeamEmail = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const params = z
      .object({
        code: z.string(),
      })
      .parse(req.body);

    const row = await prismaClient.emailVerificationRequest.findUnique({
      where: {
        verificationCode: params.code.toLowerCase(),
      },
    });

    if (row === null) {
      res.status(404).send("CODE_NOT_RECOGNIZED");
      return;
    }

    if (row.expiresAt.getTime() <= Date.now()) {
      res.status(400).send("CODE_EXPIRED");
    } else {
      await prismaClient.registeredTeam.update({
        where: {
          number: row.teamNumber,
        },
        data: {
          emailVerified: true,
          email: row.email,
        },
      });

      await kv.set(`auth:team:${row.teamNumber}`, "verified");

      res.status(200).send("Team email successfully verified");
    }
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      res.status(404).send("CODE_NOT_RECOGNIZED");
      return;
    } else if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid request parameters" });
      return;
    }
    res.status(500).json({ error: "Internal server error" });
    console.error(error);
    return;
  }
};
