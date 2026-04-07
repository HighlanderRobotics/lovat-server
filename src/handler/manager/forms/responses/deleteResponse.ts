import z from "zod";
import { AuthenticatedRequest } from "../../../../lib/middleware/requireAuth";
import { UserRole, Prisma } from "@prisma/client";
import prismaClient from "../../../../prismaClient";
import { Response } from "express";

const deleteFormResponseParamsSchema = z.object({
  formUuid: z.string(),
  responseUuid: z.string(),
});

export const deleteFormResponse = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    if (req.user.role !== UserRole.SCOUTING_LEAD) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const params = deleteFormResponseParamsSchema.parse(req.params);

    const existingFormResponse = await prismaClient.formResponse.findFirst({
      where: {
        uuid: params.responseUuid,
        form: { teamNumber: req.user.teamNumber },
      },
      include: {
        form: true,
      },
    });

    if (!existingFormResponse) {
      res.status(404).json({ error: "Form response not found" });
      return;
    }

    if (existingFormResponse.formUuid !== params.formUuid) {
      res
        .status(400)
        .json({ error: "Form response does not belong to the specified form" });
      return;
    }

    if (existingFormResponse.form.teamNumber !== req.user.teamNumber) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const form = await prismaClient.formResponse.delete({
      where: { uuid: params.responseUuid },
    });

    res.status(200).json({ form });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid input", details: error });
      return;
    } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        res.status(404).json({ error: "Form response not found" });
        return;
      }
    }
    console.error("Error deleting form response:", error);
    res
      .status(500)
      .json({ error: "An error occurred while deleting the form response." });
  }
};
