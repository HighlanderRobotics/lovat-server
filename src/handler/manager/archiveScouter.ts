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
        uuid: z.string(),
      })
      .parse(req.params);
    
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
    if (error instanceof z.ZodError) {
          res.status(400).json({ error: "Invalid request parameters" });
          return;
        }
    console.error(error);
    res.status(500).send({ error: error, displayError: "Error" });
  }
};
