import { Request, Response } from "express";
import prismaClient from "../../prismaClient";
import z from "zod";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

export const approveTeamEmail = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const params = z
      .object({
        code: z.string(),
      })
      .parse(req.body);

    const row = await prismaClient.emailVerificationRequest.delete({
      where: {
        verificationCode: params.code.toLowerCase(),
      },
    });

    if (row === null) {
      res.status(404).send("CODE_NOT_RECOGNIZED");
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

      res.status(200).send("Team email sucsessfully verified");
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
