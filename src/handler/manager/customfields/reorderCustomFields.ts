import { Response } from "express";
import prismaClient from "../../../prismaClient.js";
import z from "zod";
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth.js";
import { UserRole } from "@prisma/client";
import { invalidateCache } from "../../../lib/clearCache.js";

export const reorderCustomFields = async (
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
        fieldUuids: z.array(z.string()),
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
        displayError:
          "You need to be a scouting lead to reorder custom fields",
      });
      return;
    }

    const activeFields = await prismaClient.customField.findMany({
      where: {
        teamNumber: req.user.teamNumber,
        archived: false,
      },
      select: { uuid: true },
    });

    // The submitted list must be an exact permutation of the team's active
    // fields — anything else means the client is working from a stale list
    const activeUuids = new Set(activeFields.map((field) => field.uuid));
    const submitted = params.data.fieldUuids;
    const isExactPermutation =
      submitted.length === activeUuids.size &&
      new Set(submitted).size === submitted.length &&
      submitted.every((uuid) => activeUuids.has(uuid));

    if (!isExactPermutation) {
      res.status(400).send({
        error: `Submitted field uuids are not a permutation of team ${req.user.teamNumber}'s active custom fields`,
        displayError: "Field list is out of date. Refresh and try again.",
      });
      return;
    }

    await prismaClient.$transaction(
      submitted.map((uuid, index) =>
        prismaClient.customField.update({
          where: { uuid: uuid },
          data: { order: index },
        }),
      ),
    );

    await invalidateCache(req.user.teamNumber, []);

    res.status(200).send("done reordering custom fields");
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: error, displayError: "Error" });
  }
};
