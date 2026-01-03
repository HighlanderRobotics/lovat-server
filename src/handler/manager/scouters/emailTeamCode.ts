import { Request, Response } from "express";
import z from "zod";
import { Resend } from "resend";
import prismaClient from "@/src/prismaClient.js";

export const emailTeamCode = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const params = z
      .object({
        teamNumber: z.number(),
      })
      .safeParse({
        teamNumber: Number(req.query.teamNumber),
      });
    if (!params.success) {
      res.status(400).send(params);
      return;
    }

    const team = await prismaClient.registeredTeam.findUnique({
      where: {
        number: params.data.teamNumber,
      },
    });

    if (!team) {
      res.status(400).send({
        error: params.data.teamNumber,
        displayError: "Team is not registered with Lovat.",
      });
      return;
    }

    const resend = new Resend(process.env.RESEND_KEY);
    resend.emails.send({
      from: "noreply@lovat.app",
      to: team.email,
      subject: "Lovat Team Code",
      html: `<p>Welcome to Lovat, your team code is: <strong>${team.code}</strong></p><p>If you have received this email in error, please ignore it.</p>`,
    });

    res.status(200).send({ email: team.email });
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};
