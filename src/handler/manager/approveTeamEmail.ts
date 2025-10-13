import { Request, Response } from "express";
import prismaClient from "../../prismaClient";
import z from "zod";

export const approveTeamEmail = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const params = z
      .object({
        code: z.string(),
      })
      .parse(req.query);

    if (!params) {
      res.status(400).send(params);
      return;
    }

    const row = await prismaClient.emailVerificationRequest.findUnique({
      where: {
        verificationCode: params.code,
      },
    });

    if (row === null) {
      res.status(404).send("CODE_NOT_RECOGNIZED");
    } else if (row.expiresAt.getTime() >= Date.now()) {
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

      await prismaClient.emailVerificationRequest.delete({
        where: {
          verificationCode: params.code,
        },
      });

      res.status(200).send("Team email sucsessfully verified");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};
