import z from "zod";
import { AuthenticatedRequest } from "../../../../lib/middleware/requireAuth";
import prismaClient from "../../../../prismaClient";
import { Response } from "express";
import { FormPartType, Prisma, UserRole } from "@prisma/client";

const updateFormPartParamsSchema = z.object({
  uuid: z.string(),
  type: z.nativeEnum(FormPartType),
  caption: z.string(),
  name: z.string(),
  options: z.record(z.string(), z.unknown()),
});

export const updateFormPart = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    if (req.user.role !== UserRole.SCOUTING_LEAD) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const params = updateFormPartParamsSchema.parse({
      uuid: req.params.uuid,
      ...req.body,
    });
    const existing = await prismaClient.formPart.findUnique({
      where: { uuid: params.uuid },
      include: { form: true },
    });
    if (!existing) {
      res.status(404).json({ error: "Form part not found" });
      return;
    }
    if (existing.form.teamNumber !== req.user.teamNumber) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const formPart = await prismaClient.formPart.update({
      where: { uuid: params.uuid },
      data: {
        type: params.type,
        caption: params.caption,
        name: params.name,
        options: params.options,
      },
    });
    res.status(200).json({ formPart });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid input", details: error });
      return;
    } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        res.status(404).json({ error: "Form part not found" });
        return;
      }
    }
    console.error("Error updating form part:", error);
    res
      .status(500)
      .json({ error: "An error occurred while updating the form part." });
  }
};
