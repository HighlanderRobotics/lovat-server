import { Response } from "express";
import prismaClient from "../../../prismaClient.js";
import z from "zod";
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth.js";
import { CustomFieldType, UserRole } from "@prisma/client";
import { invalidateCache } from "../../../lib/clearCache.js";

export const MAX_ACTIVE_CUSTOM_FIELDS = 25;

const selectTypes: CustomFieldType[] = [
  CustomFieldType.SINGLE_SELECT,
  CustomFieldType.MULTI_SELECT,
];

export const addCustomField = async (
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
        name: z.string().trim().min(1).max(100),
        type: z.nativeEnum(CustomFieldType),
        options: z.array(z.string().trim().min(1).max(80)).max(30).optional(),
      })
      .safeParse(req.body);

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
        displayError: "You need to be a scouting lead to add custom fields",
      });
      return;
    }

    const options = params.data.options ?? [];
    const isSelect = selectTypes.includes(params.data.type);

    if (isSelect) {
      if (options.length === 0) {
        res.status(400).send({
          error: `Custom field of type ${params.data.type} requires at least one option`,
          displayError: "Select fields need at least one option",
        });
        return;
      }
      if (new Set(options).size !== options.length) {
        res.status(400).send({
          error: `Custom field options must be unique`,
          displayError: "Options must be unique",
        });
        return;
      }
    } else if (options.length > 0) {
      res.status(400).send({
        error: `Custom field of type ${params.data.type} cannot have options`,
        displayError: "Text and number fields can't have options",
      });
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
        displayError: `Your team already has ${MAX_ACTIVE_CUSTOM_FIELDS} active custom fields. Archive one to add more.`,
      });
      return;
    }

    const maxOrder = await prismaClient.customField.aggregate({
      where: {
        teamNumber: req.user.teamNumber,
      },
      _max: { order: true },
    });

    const field = await prismaClient.customField.create({
      data: {
        teamNumber: req.user.teamNumber,
        name: params.data.name,
        type: params.data.type,
        options: isSelect ? options : [],
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });

    await invalidateCache(req.user.teamNumber, []);

    res.status(200).send(field);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: error, displayError: "Error" });
  }
};
