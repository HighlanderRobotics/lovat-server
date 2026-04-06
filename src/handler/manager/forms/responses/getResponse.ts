import z from "zod";
import { AuthenticatedRequest } from "../../../../lib/middleware/requireAuth";
import prismaClient from "../../../../prismaClient";
import { Response } from "express";

const getResponseParamsSchema = z.object({
  responseUuid: z.string(),
});

export const getFormResponse = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const params = getResponseParamsSchema.parse(req.params);

    const formResponse = await prismaClient.formResponse.findUnique({
      where: { uuid: params.responseUuid },
      include: {
        formResponseParts: {
          orderBy: { formPartUuid: "asc" },
        },
        scouter: {
          select: { name: true },
        },
      },
    });

    if (!formResponse) {
      res.status(404).json({ error: "Form response not found" });
      return;
    }

    res.status(200).json({ formResponse });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid input", details: error });
      return;
    }
    console.error("Error getting form response:", error);
    res
      .status(500)
      .json({ error: "An error occurred while getting the form response." });
  }
};
