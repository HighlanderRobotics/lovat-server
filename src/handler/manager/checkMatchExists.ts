import z from "zod";
import { addTournamentMatches } from "./addTournamentMatches.js";
import { Request, Response } from "express";
import prismaClient from "../../prismaClient.js";
import { MatchType } from "@prisma/client";

export const checkMatchExists = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const parsed = z
      .object({
        tournamentKey: z.string(),
        teamNumber: z.coerce.number().int(),
        matchNumber: z.coerce.number().int(),
        isElim: z.coerce.boolean(),
      })
      .safeParse(req.query);

    if (!parsed.success) {
      res.status(400).send(parsed.error.flatten());
      return;
    }

    const params = parsed.data;

    await addTournamentMatches(params.tournamentKey);

    const match = await prismaClient.teamMatchData.findFirst({
      where: {
        matchNumber: params.matchNumber,
        tournamentKey: params.tournamentKey,
        teamNumber: params.teamNumber,
        matchType: params.isElim
          ? MatchType.QUALIFICATION
          : MatchType.ELIMINATION,
      },
    });

    if (match !== null) {
      res
        .status(200)
        .send({ match, alliance: Number(match.key[-1]) < 3 ? "RED" : "BLUE" });
      return;
    }
    res.status(404).send("MATCH_NOT_FOUND");
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};
