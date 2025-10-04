import { Response } from "express";
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";

export const getTournamentSource = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    res.status(200).send(req.user.tournamentSource);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};
