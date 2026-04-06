import z from "zod";
import { AuthenticatedRequest } from "../../../../lib/middleware/requireAuth";
import { UserRole, Prisma } from "@prisma/client";
import prismaClient from "../../../../prismaClient";
import { Response } from "express";

const deleteFormPartParamsSchema = z.object({
  uuid: z.string(),
});

export const deleteFormPart = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    if (req.user.role !== UserRole.SCOUTING_LEAD) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const params = deleteFormPartParamsSchema.parse(req.params);

    const form = await prismaClient.formPart.delete({
      where: { uuid: params.uuid },
    });

    res.status(200).json({ form });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid input", details: error });
      return;
    } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        res.status(404).json({ error: "Form part not found" });
        return;
      }
    } else {
      console.error("Error deleting form part:", error);
      res
        .status(500)
        .json({ error: "An error occurred while deleting the form part." });
    }
  }
};
