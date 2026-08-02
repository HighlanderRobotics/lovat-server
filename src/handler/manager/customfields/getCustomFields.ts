import { Response } from "express";
import prismaClient from "../../../prismaClient.js";
import z from "zod";
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth.js";

export const getCustomFields = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const params = z
      .object({
        archived: z
          .string()
          .transform((val) => val === "true")
          .optional(),
      })
      .safeParse(req.query);

    if (!params.success) {
      res.status(400).send({
        error: params,
        displayError:
          "Invalid input. Make sure you are using the correct input.",
      });
      return;
    }
    if (req.user.teamNumber === null) {
      res.status(403).send({
        error: `User with the id ${req.user.id} is not affiliated with a team`,
        displayError: "User is not affiliated with a team",
      });
      return;
    }

    const rows = await prismaClient.customField.findMany({
      where: {
        teamNumber: req.user.teamNumber,
        archived: params.data.archived,
      },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }, { uuid: "asc" }],
    });

    res.status(200).send(rows);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: error, displayError: "Error" });
  }
};
