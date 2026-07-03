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
    const params = z
      .object({
        tournamentKey: z.string(),
        teamNumber: z.coerce.number(),
        matchNumber: z.coerce.number(),
        matchType: z.enum(MatchType),
      })
      .parse(req.query);

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
