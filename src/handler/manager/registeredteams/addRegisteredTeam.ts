import { Response } from "express";
import prismaClient from "../../../prismaClient.js";
import z from "zod";
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth.js";
import { sendVerificationEmail } from "../onboarding/resendEmail.js";

export const addRegisteredTeam = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    if (req.tokenType === "apiKey") {
      res.status(403).json({ error: "This action cannot be performed using an API key" });
      return;
    }

    const params = z
      .object({
        email: z.string().email(),
        number: z.number(),
        code: z.string(),
      })
      .safeParse({
        email: req.body.email,
        number: req.body.number,
        code: await generateUniqueCode(),
      });
    if (!params.success) {
      res.status(400).send(params);
      return;
    }

    const toggleFeatureRow = await prismaClient.featureToggle.findUnique({
      where: {
        feature: "fullRegistration",
      },
    });
    if (!toggleFeatureRow.enabled) {
      await prismaClient.registeredTeam.create({
        data: {
          email: params.data.email,
          number: params.data.number,
          code: params.data.code,
          teamApproved: true,
        },
      });
    } else {
      await prismaClient.registeredTeam.create({
        data: {
          email: params.data.email,
          number: params.data.number,
          code: params.data.code,
        },
      });
    }

    const user = req.user;

    await prismaClient.user.update({
      data: {
        teamNumber: req.body.number,
        role: "SCOUTING_LEAD",
      },
      where: {
        id: user.id,
      },
    });

    sendVerificationEmail(params.data.email, params.data.number);

    res.status(200).send("verification email sent");
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};

function generateAlphanumericCode(length = 6): string {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

async function generateUniqueCode(): Promise<string> {
  let unique = false;
  let code: string;

  while (!unique) {
    code = generateAlphanumericCode();

    const count = await prismaClient.registeredTeam.count({
      where: { code: code },
    });

    if (count === 0) {
      unique = true;
    }
  }

  return code;
}
