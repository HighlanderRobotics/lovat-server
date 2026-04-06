import z from "zod";
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { FormPartType, UserRole } from "@prisma/client";
import prismaClient from "../../../prismaClient";
import { Response } from "express";

const createFormParamsSchema = z.object({
  team: z.number(),
  name: z.string(),
  parts: z.array(
    z.object({
      name: z.string(),
      type: z.nativeEnum(FormPartType),
      caption: z.string(),
      options: z.record(z.string(), z.unknown()).optional(),
    }),
  ),
});

export const createForm = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    if (req.user.role !== UserRole.SCOUTING_LEAD) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const params = createFormParamsSchema.parse(req.body);

    const [form, formParts] = await prismaClient.$transaction(async (tx) => {
      const form = await tx.form.create({
        data: { name: params.name, teamNumber: params.team },
      });
      const formParts = await tx.formPart.createManyAndReturn({
        data: params.parts.map((part, index) => ({
          name: part.name,
          formUuid: form.uuid,
          type: part.type,
          caption: part.caption ?? "",
          options: part.options ?? {},
          order: index,
        })),
      });
      return [form, formParts];
    });

    res.status(200).json({ form, formParts });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid input", details: error });
      return;
    }
    console.error("Error creating form:", error);
    res
      .status(500)
      .json({ error: "An error occurred while creating the form." });
  }
};
