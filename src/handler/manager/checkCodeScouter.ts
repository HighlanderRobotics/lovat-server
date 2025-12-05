import { Request, Response } from "express";
import prismaClient from "../../prismaClient.js";
import z from "zod";

export const checkCodeScouter = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const params = z
      .object({
        code: z.string(),
      })
      .safeParse({
        code: req.query.code,
      });
    if (!params.success) {
      res.status(400).send({
        error: params,
        displayError:
          "Invalid input. Make sure you are using the correct input.",
      });
      return;
    }

    const teamWithCode = await prismaClient.registeredTeam.findUnique({
      where: {
        code: params.data.code,
      },
    });
    console.log(teamWithCode);
    if (teamWithCode === null) {
      //not a valid code
      res.status(200).send(false);
    } else {
      res.status(200).send(teamWithCode);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: error, displayError: "Error" });
  }
};
