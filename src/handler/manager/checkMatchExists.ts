import z from "zod";
import { addTournamentMatches } from "./addTournamentMatches";
import { Request, Response } from "express";
import prismaClient from "../../prismaClient";
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
        matchType: z.nativeEnum(MatchType),
      })
      .safeParse(req.query);

    if (!parsed.success) {
      res.status(400).send(parsed.error.flatten());
      return;
    }

    const params = parsed.data;

    await addTournamentMatches(params.tournamentKey);

    const match = await prismaClient.teamMatchData.findFirst({
      where: params,
    });

    res.status(200).send(match);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};
