import { Request, Response } from "express";
import prismaClient from "../../prismaClient";
import z from "zod";

export const currentTournamentStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const params = z
      .object({
        tournamentKey: z.string(),
        teamNumber: z.string().transform((v) => Number(v)),
      })
      .parse(req.query);

    const matches = await prismaClient.teamMatchData.findMany({
        where: {
          tournamentKey: params.tournamentKey,
          teamNumber: params.teamNumber,
          matchType: "QUALIFICATION"
        },
        select: { 
            teamNumber: true 
        },
      });

    if (!matches) {
      res.status(404).send("Team not in tournament!");
      return;
    }

    const team: {
      number: number;
      name: string;
    } = (
      await prismaClient.team.findUnique({
        where: {
          number: params.teamNumber
        },
      })
    );

    const out = {
      ...team,
      rank: null,
      rankingPoints: null,
      matchesPlayed: null,
      matchesTotal: null,
    };

      const tbaResponse = await fetch(
        `https://www.thebluealliance.com/api/v3/event/${params.tournamentKey}/teams/statuses`,
        {
          headers: {
            "X-TBA-Auth-Key": process.env.TBA_KEY
          }
        }
      );
      if (!tbaResponse.ok) throw Error("Failed to fetch from TBA");

      const tbaTeams = z.record(z.string(), z.object({
        qual: z.object({
          ranking: z.object({
            rank: z.number(),
            ranking_points: z.number().optional(),
            matches_played: z.number(),
            sort_orders: z.array(z.number())
          })
        })
      })).parse(await tbaResponse.json());

      const tbaTeam = tbaTeams[`frc${out.number}`];

      out.rank = tbaTeam.qual.ranking.rank;
      out.matchesPlayed = tbaTeam.qual.ranking.matches_played;
      out.rankingPoints = Math.round(tbaTeam.qual.ranking.sort_orders[0] * out.matchesPlayed);
      out.matchesTotal = matches.length;

      res.status(200).send(out);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
}
