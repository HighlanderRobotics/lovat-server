import { Response } from "express";
import prismaClient from "../../../prismaClient.js";
import z from "zod";
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth.js";
import { UserRole } from "@prisma/client";
import { invalidateCache } from "../../../lib/clearCache.js";
import { MAX_ACTIVE_CUSTOM_FIELDS } from "./addCustomField.js";

export const unarchiveCustomField = async (
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
          "You need to be a scouting lead to unarchive custom fields",
      });
      return;
    }

    const field = await prismaClient.customField.findUnique({
      where: {
        uuid: params.data.uuid,
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
        displayError: "Not authorized to unarchive this custom field",
      });
      return;
    }

    if (!field.archived) {
      res.status(200).send("done unarchiving custom field");
      return;
    }

    const activeCount = await prismaClient.customField.count({
      where: {
        teamNumber: req.user.teamNumber,
        archived: false,
      },
    });
    if (activeCount >= MAX_ACTIVE_CUSTOM_FIELDS) {
      res.status(400).send({
        error: `Team ${req.user.teamNumber} already has ${MAX_ACTIVE_CUSTOM_FIELDS} active custom fields`,
        displayError: `Your team already has ${MAX_ACTIVE_CUSTOM_FIELDS} active custom fields. Archive one before unarchiving this field.`,
      });
      return;
    }

    await prismaClient.customField.update({
      where: {
        uuid: field.uuid,
      },
      data: {
        archived: false,
      },
    });

    await invalidateCache(req.user.teamNumber, []);

    res.status(200).send("done unarchiving custom field");
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: error, displayError: "Error" });
  }
};
