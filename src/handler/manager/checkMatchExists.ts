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
        isElim: z
          .union([z.literal("true"), z.literal("false"), z.boolean()])
          .transform((value) => value === true || value === "true"),
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
          ? MatchType.ELIMINATION
          : MatchType.QUALIFICATION,
      },
    });

    if (match !== null) {
      res.status(200).send({
        match,
        alliance: Number(match.key.at(-1)) < 3 ? "red" : "blue",
      });
      return;
    }
    res.status(404).send("MATCH_NOT_FOUND");
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};
