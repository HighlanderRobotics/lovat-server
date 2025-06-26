import { Request, Response } from "express";
import prismaClient from "../../prismaClient";
import z from "zod";

export const getTeamRankings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const params = z
      .object({
        tournamentKey: z.string(),
      })
      .safeParse({
        tournamentKey: req.params.tournament,
      });
    if (!params.success) {
      res.status(400).send(params);
      return;
    }

    const rows = await prismaClient.teamMatchData.findMany({
      where: {
        tournamentKey: params.data.tournamentKey,
      },
      select: {
        teamNumber: true,
      },
    });
    if (!rows) {
      res.status(404).send("Tournament or teams not found");
      return;
    }

    const uniqueTeamNumbers = Array.from(
      new Set(rows.map((row) => row.teamNumber))
    );
    const teams: {
      number: number;
      name: string;
      rank: number | null;
      rankingPoints: number | null;
      matchesPlayed: number | null;
    }[] = (
      await prismaClient.team.findMany({
        where: {
          number: {
            in: uniqueTeamNumbers,
          },
        },
      })
    ).map((e) => ({
      ...e,
      rank: null,
      rankingPoints: null,
      matchesPlayed: null,
    }));

    try {
      const tbaResponse = await fetch(
        `https://www.thebluealliance.com/api/v3/event/${params.data.tournamentKey}/teams/statuses`
      );
      if (!tbaResponse.ok) throw Error("Failed to fetch from TBA");

      const tbaTeams = await tbaResponse.json();

      for (const team of tbaTeams) {
        try {
          const tbaTeam = tbaTeams[`frc${team.number}`];

          team.rank = tbaTeam.qual.ranking.rank;
          team.matchesPlayed = tbaTeam.qual.ranking.matches_played;
          team.rankingPoints = Math.round(
            tbaTeam.qual.ranking.sort_orders[0] * team.matchesPlayed
          );
        } catch (e) {
          continue;
        }
      }
    } finally {
      res.status(200).send(teams);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};
