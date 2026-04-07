import z from "zod";
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import prismaClient from "../../../prismaClient";
import { Response } from "express";
import { Prisma } from "@prisma/client";

const updateFormNameParamsSchema = z.object({
  formUuid: z.string(),
  name: z.string(),
});

export const updateFormName = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    if (req.user.role !== "SCOUTING_LEAD") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const params = updateFormNameParamsSchema.safeParse({
      formUuid: req.params.formUuid,
      name: req.body.name,
    });

    if (!params.success) {
      res.status(400).json({ error: "Invalid input", details: params.error });
      return;
    }

    const form = await prismaClient.form.update({
      where: { uuid: params.data.formUuid, teamNumber: req.user.teamNumber },
      data: { name: params.data.name },
    });

    res.status(200).json({ form });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        res.status(404).json({ error: "Form not found" });
        return;
      }
    }
    console.error("Error updating form name:", error);
    res
      .status(500)
      .json({ error: "An error occurred while updating the form name." });
  }
};
