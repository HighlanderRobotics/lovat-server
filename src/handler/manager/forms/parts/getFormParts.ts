import z from "zod";
import { AuthenticatedRequest } from "../../../../lib/middleware/requireAuth";
import prismaClient from "../../../../prismaClient";
import { Response } from "express";

const getFormPartParamsSchema = z.object({
  formPartUuid: z.string(),
});

export const getFormPart = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const params = getFormPartParamsSchema.parse(req.params);

    const formPart = await prismaClient.formPart.findUnique({
      where: { uuid: params.formPartUuid },
      include: {
        formResponseParts: {
          orderBy: { formResponseUuid: "asc" },
        },
      },
    });

    if (!formPart) {
      res.status(404).json({ error: "Form part not found" });
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
