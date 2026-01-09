import { Request, Response } from "express";
import prismaClient from "../../../prismaClient.js";
import z from "zod";

export const approveRegisteredTeam = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    //check its coming from Collin

    const params = z
      .object({
        number: z.number().min(0),
      })
      .safeParse({
        number: Number(req.params.team),
      });

    if (!params.success) {
      res.status(400).send(params);
      return;
    }
    const rows = await prismaClient.registeredTeam.update({
      where: {
        number: params.data.number,
      },
      data: {
        teamApproved: true,
      },
    });
    res.status(200).send(rows);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};
