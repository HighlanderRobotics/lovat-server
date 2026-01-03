import { Request, Response } from "express";
import prismaClient from "@/src/prismaClient.js";
import z from "zod";

export const addNewScouter = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const params = z
      .object({
        team: z.number(),
        name: z.string(),
      })
      .safeParse({
        team: req.body.teamNumber,
        name: req.body.name,
      });
    if (!params.success) {
      res.status(400).send({
        error: params,
        displayError:
          "Invalid input. Make sure you are using the correct input.",
      });
      return;
    }
    const user = await prismaClient.scouter.create({
      data: {
        name: params.data.name,
        sourceTeamNumber: params.data.team,
      },
    });
    res.status(200).send(user);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: error, displayError: "Error" });
  }
};
