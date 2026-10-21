import { Response } from "express";
import prismaClient from "../../../prismaClient.js";
import z from "zod";
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth.js";
import { UserRole } from "@prisma/client";
import { invalidateCache } from "../../../lib/clearCache.js";

export const deleteCustomField = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    if (req.tokenType === "apiKey") {
      res
        .status(403)
        .json({ error: "This action cannot be performed using an API key" });
      return;
    }

    const params = z
      .object({
        uuid: z.string(),
      })
      .safeParse(req.params);

    if (!params.success) {
      res.status(400).send({
        error: params,
        displayError:
          "Invalid input. Make sure you are using the correct input.",
      });
      return;
    }
    if (
      req.user.role !== UserRole.SCOUTING_LEAD ||
      req.user.teamNumber === null
    ) {
      res.status(403).send({
        error: `User with the id ${req.user.id} is not a scouting lead on a team`,
        displayError:
          "You need to be a scouting lead to delete custom fields",
      });
      return;
    }

    const field = await prismaClient.customField.findUnique({
      where: {
        uuid: params.data.uuid,
      },
      include: {
        _count: {
          select: { answers: true },
        },
      },
    });
    if (!field) {
      res.status(404).send({
        error: `Custom field with the uuid ${params.data.uuid} does not exist`,
        displayError: "Custom field not found",
      });
      return;
    }
    if (field.teamNumber !== req.user.teamNumber) {
      res.status(403).send({
        error: `User with the id ${req.user.id} is not on the same team as the custom field ${field.uuid}`,
        displayError: "Not authorized to delete this custom field",
      });
      return;
    }

    if (field._count.answers > 0) {
      res.status(409).send({
        error: `Custom field ${field.uuid} has ${field._count.answers} recorded answers`,
        displayError:
          "This field has recorded answers. Archive it instead to preserve them.",
      });
      return;
    }

    await prismaClient.customField.delete({
      where: {
        uuid: field.uuid,
      },
    });

    await invalidateCache(req.user.teamNumber, []);

    res.status(200).send("done deleting custom field");
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: error, displayError: "Error" });
  }
};
