import { Response } from "express";
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth.js";

export const getPracticeSource = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    res.status(200).json(req.user.includePracticeMatches);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error getting practice source");
  }
};
