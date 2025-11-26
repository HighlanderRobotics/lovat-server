import { Request, Response } from "express";
import prismaClient from "../../prismaClient";
import z from "zod";

export const getScoutersOnTeam = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    console.log(req.headers);
    const params = z
      .object({
        teamCode: z.string(),
        archived: z.boolean().optional(),
      })
      .safeParse({
        teamCode: req.headers["x-team-code"],
        archived: req.query.archived,
      });

    if (!params.success) {
      res.status(400).send({
        error: params,
        displayError:
          "Invalid input. Make sure you are using the correct input.",
      });
      return;
    }
    const teamRow = await prismaClient.registeredTeam.findUnique({
      where: {
        code: params.data.teamCode,
      },
    });
    if (!teamRow) {
      res.status(404).send({
        error: `The team code ${params.data.teamCode}`,
        displayError: "Team code does not exist",
      });
      return;
    }
    const rows = await prismaClient.scouter.findMany({
      where: {
        sourceTeamNumber: teamRow.number,
        archived: params.data.archived,
      },
    });
    res.status(200).send(rows);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: error, displayError: "Error" });
  }
};
