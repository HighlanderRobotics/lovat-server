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
        teamNumber: z.number(),
      })
      .safeParse({
        tournamentKey: req.params.tournament,
        teamNumber: req.params.teamNumber,
      });
    if (!params.success) {
      res.status(400).send(params);
      return;
    }

    const rows = await prismaClient.teamMatchData.findMany({
        where: {
          tournamentKey: params.data.tournamentKey,
          teamNumber: params.data.teamNumber,
        },
        select: { 
            teamNumber: true 
        },
      });

    if (!rows) {
      res.status(404).send("Team not in tournament!");
      return;
    }

    const team: {
      number: number;
      name: string;
      rank: number | null;
      rankingPoints: number | null;
      matchesPlayed: number | null;
    }[] = (
      await prismaClient.team.findUnique({
        where: {
          number: params.data.teamNumber
        },
      })
    );

    const out = {
      ...team,
      rank: null,
      rankingPoints: null,
      matchesPlayed: null,
    };

    try {
      const tbaResponse = await fetch(
        `https://www.thebluealliance.com/api/v3/event/${params.data.tournamentKey}/teams/statuses`
      );
      if (!tbaResponse.ok) throw Error("Failed to fetch from TBA");

      const tbaTeams = await tbaResponse.json();

    try {
        const tbaTeam = tbaTeams[`frc${out.number}`];

        out.rank = tbaTeam.qual.ranking.rank;
        out.matchesPlayed = tbaTeam.qual.ranking.matches_played;
        out.rankingPoints = Math.round(tbaTeam.qual.ranking.sort_orders[0] * out.matchesPlayed);

    } catch (e) {
        res.status(404).send("Team data not found in TBA");
    } finally {
      res.status(200).send(team);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
}
};
