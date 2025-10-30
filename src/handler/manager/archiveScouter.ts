import { Request, Response } from "express";
import prismaClient from "../../prismaClient";
import z from "zod";

export const archiveScouter = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const params = z
      .object({
        uuid: z.string()
      })
      .parse(req.params);
    if (!params) {
      res.status(400).send({
        error: params,
        displayError:
          "Invalid input. Make sure you are using the correct input.",
      });
      return;
    }
    await prismaClient.scouter.update({
      where: {
        uuid: params.uuid,
      },
      data: {
        archived: true,
      },
    });
    res.status(200).send("done archiving scouter");
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: error, displayError: "Error" });
  }
};
