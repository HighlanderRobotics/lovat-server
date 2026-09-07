import z from "zod";
import { AuthenticatedRequest } from "../../../../lib/middleware/requireAuth";
import prismaClient from "../../../../prismaClient";
import { Response } from "express";

const getFormPartParamsSchema = z.object({
  uuid: z.string(),
});

export const getFormPart = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const params = getFormPartParamsSchema.parse(req.params);

    const formPart = await prismaClient.formPart.findUnique({
      where: { uuid: params.uuid },
      include: {
        formResponseParts: {
          orderBy: { formResponseUuid: "asc" },
        },
        form: {
          select: { teamNumber: true },
        },
      },
    });

    if (!formPart) {
      res.status(404).json({ error: "Form part not found" });
      return;
    }

    if (formPart.form.teamNumber !== req.user.teamNumber) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    res.status(200).json({ formPart });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid input", details: error });
      return;
    }
    console.error("Error getting form parts:", error);
    res
      .status(500)
      .json({ error: "An error occurred while getting the form parts." });
  }
};
