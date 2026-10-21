import z from "zod";
import { AuthenticatedRequest } from "../../../../lib/middleware/requireAuth";
import prismaClient from "../../../../prismaClient";
import { Response } from "express";
import { Prisma, UserRole } from "@prisma/client";

const updateFormPartParamsSchema = z.object({
  formUuid: z.string(),
  uuid: z.string(),
  order: z.number(),
});

export const reorderFormParts = async (
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
      formUuid: req.params.formUuid,
      ...req.body,
    });
    const formPart = await prismaClient.$transaction(async (tx) => {
      const form = await tx.form.findUnique({
        where: { uuid: params.formUuid },
      });
      if (!form) {
        throw new Error("Form not found");
      }
      if (form.teamNumber !== req.user.teamNumber) {
        throw new Error("Forbidden");
      }
      const formParts = await tx.formPart.findMany({
        where: { formUuid: params.formUuid },
        orderBy: { order: "asc" },
      });
      const target = formParts.find((p) => p.uuid === params.uuid);
      if (!target) {
        throw new Error("Form part not found");
      }
      const without = formParts.filter((p) => p.uuid !== params.uuid);
      without.splice(params.order, 0, target);
      const reordered = without.map((p, index) => ({ ...p, order: index }));
      const updatedFormParts = await Promise.all(
        reordered.map((p) =>
          tx.formPart.update({
            where: { uuid: p.uuid },
            data: { order: p.order },
          }),
        ),
      );
      return updatedFormParts.find((p) => p.uuid === params.uuid);
    });
    res.status(200).json({ formPart });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid input", details: error });
      return;
    } else if (error instanceof Error) {
      if (error.message === "Form not found") {
        res.status(404).json({ error: "Form not found" });
        return;
      } else if (error.message === "Forbidden") {
        res.status(403).json({ error: "Forbidden" });
        return;
      } else if (error.message === "Form part not found") {
        res.status(404).json({ error: "Form part not found" });
        return;
      }
    } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        res.status(404).json({ error: "Form part not found" });
        return;
      }
    }
    console.error("Error reordering form part:", error);
    res
      .status(500)
      .json({ error: "An error occurred while reordering the form part." });
  }
};
