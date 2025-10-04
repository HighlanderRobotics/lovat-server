import { Request, Response } from "express";
import prismaClient from "../../prismaClient";
import z from "zod";

export const rejectRegisteredTeam = async (
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
    const rows = await prismaClient.registeredTeam.delete({
      where: {
        number: params.data.number,
      },
    });
    res.status(200).send(`Team ${req.params.team} removed`);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};
