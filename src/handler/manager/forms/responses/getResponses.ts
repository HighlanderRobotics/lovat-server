import z from "zod";
import { AuthenticatedRequest } from "../../../../lib/middleware/requireAuth";
import prismaClient from "../../../../prismaClient";
import { Response } from "express";

const getResponsesParamsSchema = z.object({
  formUuid: z.string(),
});

export const getFormResponses = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const params = getResponsesParamsSchema.parse(req.params);

    const form = await prismaClient.form.findUnique({
      where: { uuid: params.formUuid },
      include: {
        formResponses: {
          include: {
            formResponseParts: {
              orderBy: { formPartUuid: "asc" },
            },
            scouter: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!form) {
      res.status(404).json({ error: "Form not found" });
      return;
    }

    res.status(200).json({ form });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid input", details: error });
      return;
    }
    console.error("Error getting form responses:", error);
    res
      .status(500)
      .json({ error: "An error occurred while getting the form responses." });
  }
};
