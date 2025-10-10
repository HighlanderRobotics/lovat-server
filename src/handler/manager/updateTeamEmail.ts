import { Response } from "express";
import prismaClient from "../../prismaClient";
import z from "zod";
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";
import { Resend } from "resend";
import { randomBytes } from "crypto";
import { DateTime } from "luxon";

export const updateTeamEmail = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const params = z
      .object({
        email: z.string().email(),
      })
      .parse(req.query)

    if (!params) {
      res.status(400).send(params);
      return;
    }

    const code = randomBytes(8).toString("hex")

    const verificationUrl = `https://lovat.app/verify/${code}`;
    const resend = new Resend(process.env.RESEND_KEY);

    await prismaClient.emailVerificationRequest.create({
      data: {
        verificationCode: code,
        email: params.email,
        expiresAt: DateTime.now().plus({ minutes: 20 }),
        teamNumber: req.user.teamNumber
      }
    })

    resend.emails.send({
      from: "noreply@lovat.app",
      to: params.email,
      subject: "Lovat Email Verification",
      html: `<p>Welcome to Lovat, click <a href="${verificationUrl}" target="_blank">here</a> to verify your team email!</p>`,
    });


    res.status(200).send("verification email sent");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error in deleting data");
  }
};