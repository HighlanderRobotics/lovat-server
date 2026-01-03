import { Response } from "express";
import prismaClient from "@/src/prismaClient.js";
import { AuthenticatedRequest } from "@/src/lib/middleware/requireAuth.js";
import { Resend } from "resend";
import { randomBytes } from "crypto";
import { DateTime } from "luxon";

export const resendEmail = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const teamRow = await prismaClient.registeredTeam.findUnique({
      where: {
        number: req.user.teamNumber,
      },
    });

    if (teamRow === null) {
      res.status(404).send("team not found");
    }

    sendVerificationEmail(teamRow.email, teamRow.number);

    res.status(200).send("verification email sent");
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};

export async function sendVerificationEmail(
  email: string,
  teamNumber: number,
): Promise<void> {
  const code = randomBytes(8).toString("hex");

  const verificationUrl = `${process.env.LOVAT_WEBSITE}/verify/${code}`;
  const resend = new Resend(process.env.RESEND_KEY);

  await prismaClient.emailVerificationRequest.create({
    data: {
      verificationCode: code,
      email: email,
      expiresAt: DateTime.now().plus({ minutes: 20 }).toJSDate(),
      teamNumber: teamNumber,
    },
  });

  resend.emails.send({
    from: "noreply@lovat.app",
    to: email,
    subject: "Lovat Email Verification",
    html: `<p>Welcome to Lovat, click <a href="${verificationUrl}" target="_blank">here</a> to verify your team email!</p>`,
  });
}
