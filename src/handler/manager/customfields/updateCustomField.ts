import { Response } from "express";
import prismaClient from "../../../prismaClient.js";
import z from "zod";
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth.js";
import { CustomFieldType, UserRole } from "@prisma/client";
import { invalidateCache } from "../../../lib/clearCache.js";

export const updateCustomField = async (
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
        name: z.string().trim().min(1).max(100).optional(),
        options: z.array(z.string().trim().min(1).max(80)).max(30).optional(),
      })
      .safeParse({
        uuid: req.params.uuid,
        name: req.body.name,
        options: req.body.options,
      });

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
        displayError: "You need to be a scouting lead to edit custom fields",
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
        displayError: "Not authorized to edit this custom field",
      });
      return;
    }

    const options = params.data.options;
    if (options !== undefined) {
      if (
        field.type === CustomFieldType.TEXT ||
        field.type === CustomFieldType.NUMBER
      ) {
        if (options.length > 0) {
          res.status(400).send({
            error: `Custom field of type ${field.type} cannot have options`,
            displayError: "Text and number fields can't have options",
          });
          return;
        }
      } else {
        if (new Set(options).size !== options.length) {
          res.status(400).send({
            error: `Custom field options must be unique`,
            displayError: "Options must be unique",
          });
          return;
        }
        // Options are append/reorder-only so stored answers stay valid
        const newOptionSet = new Set(options);
        if (field.options.some((option) => !newOptionSet.has(option))) {
          res.status(400).send({
            error: `Options for custom field ${field.uuid} can only be added or reordered`,
            displayError:
              "Options can only be added or reordered. Existing options can't be removed or renamed.",
          });
          return;
        }
      }
    }

    const updated = await prismaClient.customField.update({
      where: {
        uuid: field.uuid,
      },
      data: {
        ...(params.data.name !== undefined ? { name: params.data.name } : {}),
        ...(options !== undefined ? { options: options } : {}),
      },
    });

    await invalidateCache(req.user.teamNumber, []);

    res.status(200).send(updated);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: error, displayError: "Error" });
  }
};
