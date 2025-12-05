import { Request, Response } from "express";
import prismaClient from "../../prismaClient.js";
import z from "zod";

export const changeNameScouter = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const params = z
      .object({
        uuid: z.string(),
        name: z.string(),
      })
      .safeParse({
        uuid: req.params.uuid,
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
    await prismaClient.scouter.update({
      where: {
        uuid: params.data.uuid,
      },
      data: {
        name: params.data.name,
      },
    });
    res.status(200).send("done changing name to provided scouter");
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: error, displayError: "Error" });
  }
};
