import z from "zod";
import { AuthenticatedRequest } from "../../../../lib/middleware/requireAuth";
import prismaClient from "../../../../prismaClient";
import { Response } from "express";
import { FormPartType, UserRole } from "@prisma/client";

const createFormPartParamsSchema = z.object({
  formUuid: z.string(),
  type: z.nativeEnum(FormPartType),
  caption: z.string(),
  name: z.string(),
  options: z.record(z.string(), z.unknown()),
  order: z.number(),
});

export const createFormPart = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    if (req.user.role !== UserRole.SCOUTING_LEAD) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const params = createFormPartParamsSchema.parse({
      formUuid: req.params.formUuid,
      ...req.body,
    });
    const form = await prismaClient.form.findUnique({
      where: { uuid: params.formUuid },
    });
    if (!form) {
      res.status(404).json({ error: "Form not found" });
      return;
    }
    const formPart = await prismaClient.$transaction(async (tx) => {
      const existing = await tx.formPart.findMany({
        where: { formUuid: params.formUuid },
        orderBy: { order: "asc" },
      });
      const formPart = await tx.formPart.create({
        data: {
          formUuid: params.formUuid,
          type: params.type,
          caption: params.caption,
          name: params.name,
          options: params.options,
          order: params.order,
        },
      });
      const without = existing.filter((p) => p.uuid !== formPart.uuid);
      without.splice(params.order, 0, formPart);
      const reordered = without.map((p, index) => ({ ...p, order: index }));
      await Promise.all(
        reordered.map((p) =>
          tx.formPart.update({
            where: { uuid: p.uuid },
            data: { order: p.order },
          }),
        ),
      );
      return formPart;
    });
    res.status(201).json({ formPart });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid input", details: error });
      return;
    }
    console.error("Error creating form part:", error);
    res
      .status(500)
      .json({ error: "An error occurred while creating the form part." });
  }
};
