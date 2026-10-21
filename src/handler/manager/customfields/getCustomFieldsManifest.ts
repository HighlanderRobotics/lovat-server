import { Request, Response } from "express";
import prismaClient from "../../../prismaClient.js";
import z from "zod";
import SHA256 from "crypto-js/sha256.js";
import { getActiveCustomFields } from "../../analysis/customFields/customFieldShared.js";

export const getCustomFieldsManifest = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const params = z
      .object({
        teamCode: z.string(),
      })
      .safeParse({
        teamCode: req.headers["x-team-code"],
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

    const fields = await getActiveCustomFields(teamRow.number);
    const data = fields.map((field) => ({
      uuid: field.uuid,
      name: field.name,
      type: field.type,
      options: field.options,
    }));

    res
      .status(200)
      .send({ hash: SHA256(JSON.stringify(data)).toString(), data: data });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: error, displayError: "Error" });
  }
};
