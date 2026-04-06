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

    const formParts = await prismaClient.formPart.findMany({
      where: { formUuid: params.formUuid },
      orderBy: { order: "asc" },
    });

    const target = formParts.find((p) => p.uuid === params.uuid);

    if (!target) {
      res.status(404).json({ error: "Form part not found" });
      return;
    }

    const reordered = formParts.map((p) => ({
      ...p,
      order:
        p.uuid === params.uuid
          ? params.order
          : p.order >= params.order
            ? p.order + 1
            : p.order,
    }));

    const updatedFormParts = await prismaClient.$transaction(
      reordered.map((formPart) =>
        prismaClient.formPart.update({
          where: { uuid: formPart.uuid },
          data: { order: formPart.order },
        }),
      ),
    );
    const formPart = updatedFormParts.find((part) => part.uuid === params.uuid);

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
    console.error("Error reordering form part:", error);
    res
      .status(500)
      .json({ error: "An error occurred while reordering the form part." });
  }
};
