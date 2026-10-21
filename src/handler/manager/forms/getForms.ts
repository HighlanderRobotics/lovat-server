import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import prismaClient from "../../../prismaClient";
import { Response } from "express";

export const getForms = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const forms = await prismaClient.form.findMany({
      where: {
        teamNumber: req.user.teamNumber,
      },
      include: {
        formParts: {
          orderBy: { order: "asc" },
        },
      },
    });

    res.status(200).json({ forms });
  } catch (error) {
    console.error("Error getting forms:", error);
    res
      .status(500)
      .json({ error: "An error occurred while getting the forms." });
  }
};
