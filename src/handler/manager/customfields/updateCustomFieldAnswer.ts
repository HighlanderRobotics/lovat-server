import { Response } from "express";
import prismaClient from "../../../prismaClient.js";
import z from "zod";
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth.js";
import { CustomFieldType, UserRole } from "@prisma/client";
import { invalidateCache } from "../../../lib/clearCache.js";

// Edit the text of a single TEXT custom field answer. Only a scouting lead of
// the team that owns the field may do this. Number/select answers are not
// editable here — those are corrected by resubmitting the scout report.
export const updateCustomFieldAnswer = async (
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
        value: z.string().trim().min(1).max(1000),
      })
      .safeParse({
        uuid: req.params.uuid,
        value: req.body.value,
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
        displayError:
          "You need to be a scouting lead to edit custom field answers",
      });
      return;
    }

    const answer = await prismaClient.customFieldAnswer.findUnique({
      where: { uuid: params.data.uuid },
      include: {
        field: true,
        scoutReport: {
          select: { teamMatchData: { select: { teamNumber: true } } },
        },
      },
    });
    if (!answer) {
      res.status(404).send({
        error: `Custom field answer with the uuid ${params.data.uuid} does not exist`,
        displayError: "Answer not found",
      });
      return;
    }
    if (answer.field.teamNumber !== req.user.teamNumber) {
      res.status(403).send({
        error: `User with the id ${req.user.id} is not on the same team as the custom field ${answer.fieldUuid}`,
        displayError: "Not authorized to edit this answer",
      });
      return;
    }
    if (answer.field.type !== CustomFieldType.TEXT) {
      res.status(400).send({
        error: `Only text custom field answers can be edited here (field type is ${answer.field.type})`,
        displayError: "Only text answers can be edited here",
      });
      return;
    }

    const updated = await prismaClient.customFieldAnswer.update({
      where: { uuid: answer.uuid },
      data: { textValue: params.data.value },
    });

    // Clear the scouted team's cached analysis (Team Lookup notes) so the edit
    // shows up. The raw report itself is uncached.
    await invalidateCache(answer.scoutReport.teamMatchData.teamNumber, []);

    res.status(200).send(updated);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: error, displayError: "Error" });
  }
};
