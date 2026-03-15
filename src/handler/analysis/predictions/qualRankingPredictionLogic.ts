import axios from "axios";
import prismaClient from "../../../prismaClient.js";
import { matchPredictionLogic } from "./matchPredictionLogic.js";
import { User } from "@prisma/client";
import { alliancePage } from "./alliancePage.js";
import z from "zod";
import { runAnalysis } from "../analysisFunction.js";

type TeamRanking = {
  teamNumber: number;
  wins: number;
  losses: number;
  ties: number;
  rankingPoints: number;
  matchesPlayed: number;
  combinedScore: number;
  averageScore: number;
  highScore: number;
};

const config = {
  argsSchema: z.object({
    tournamentKey: z.string(),
  }),
  returnSchema: z.array(
    z.object({
      teamNumber: z.number(),
      rankingPoints: z.number(),
      wins: z.number(),
      losses: z.number(),
      ties: z.number(),
      matchesPlayed: z.number(),
      combinedScore: z.number(),
      averageScore: z.number(),
      highScore: z.number(),
    }),
  ),
  usesDataSource: true,
  shouldCache: true,
  createKey: async (args) => ({
    key: ["qualPredictionLogic", args.tournamentKey],
    tournamentDependencies: [args.tournamentKey],
  }),
  calculateAnalysis: async (args, ctx) => {
    let matchesResponse = null;
    let teamsResponse = null;

    const url = "https://www.thebluealliance.com/api/v3";
    try {
      matchesResponse = await axios.get(
        `${url}/event/${args.tournamentKey}/matches`,
        {
          headers: {
            "X-TBA-Auth-Key": process.env.TBA_KEY,
          },
        },
      );
    } catch (error) {
      console.error("Error fetching matches:", error);
    }

    try {
      teamsResponse = await axios.get(
        `${url}/event/${args.tournamentKey}/teams/simple`,
        {
          headers: {
            "X-TBA-Auth-Key": process.env.TBA_KEY,
          },
        },
      );
    } catch (error) {
      console.error("Error fetching teams:", error);
    }

    if (!matchesResponse || !teamsResponse) {
      throw new Error("Failed to fetch match or team data from TBA");
    }

    matchesResponse.data.sort((a, b) => a.predicted_time - b.predicted_time);

    const lastMatch = (
      await prismaClient.teamMatchData.findFirstOrThrow({
        where: {
          tournamentKey: args.tournamentKey,
          scoutReports: {
            some: {},
          },
        },
        orderBy: {
          matchNumber: "desc",
        },
      })
    ).matchNumber;

    const teams: Record<number, TeamRanking> = teamsResponse.data.reduce(
      (acc, team) => {
        acc[team.team_number] = {
          teamNumber: team.team_number,
          wins: 0,
          losses: 0,
          ties: 0,
          rankingPoints: 0,
          matchesPlayed: 0,
          combinedScore: 0,
          averageScore: 0,
          highScore: 0,
        };
        return acc;
      },
      {} as Record<number, TeamRanking>,
    );

    for (const match of matchesResponse.data) {
      if (match.comp_level === "qm") {
        const redTeams = match.alliances.red.team_keys.map((key: string) =>
          parseInt(key.slice(3)),
        );
        const blueTeams = match.alliances.blue.team_keys.map((key: string) =>
          parseInt(key.slice(3)),
        );
        if (match.match_number <= lastMatch) {
          const redRPs = match.score_breakdown?.red?.rp || 0;
          const blueRPs = match.score_breakdown?.blue?.rp || 0;

          for (const team of redTeams) {
            if (match.winning_alliance === "red") {
              teams[team].wins += 1;
            } else if (match.winning_alliance === "blue") {
              teams[team].losses += 1;
            } else {
              teams[team].ties += 1;
            }
            teams[team].rankingPoints += redRPs;
            teams[team].matchesPlayed += 1;
            teams[team].combinedScore += match.alliances.red.score;
            teams[team].highScore = Math.max(
              teams[team].highScore,
              match.alliances.red.score,
            );
          }

          for (const team of blueTeams) {
            if (match.winning_alliance === "blue") {
              teams[team].wins += 1;
            } else if (match.winning_alliance === "red") {
              teams[team].losses += 1;
            } else {
              teams[team].ties += 1;
            }
            teams[team].rankingPoints += blueRPs;
            teams[team].matchesPlayed += 1;
            teams[team].combinedScore += match.alliances.blue.score;
            teams[team].highScore = Math.max(
              teams[team].highScore,
              match.alliances.blue.score,
            );
          }
        } else {
          let redRPs = 0;
          let blueRPs = 0;
          let matchPrediction;

          try {
            matchPrediction = await matchPredictionLogic(ctx.user, {
              red1: redTeams[0],
              red2: redTeams[1],
              red3: redTeams[2],
              blue1: blueTeams[0],
              blue2: blueTeams[1],
              blue3: blueTeams[2],
            });
          } catch (error) {
            if (error === "not enough data") {
              throw "not enough data";
            }
          }

          const redAlliance = await alliancePage(ctx.user, {
            team1: redTeams[0],
            team2: redTeams[1],
            team3: redTeams[2],
          });

          const blueAlliance = await alliancePage(ctx.user, {
            team1: blueTeams[0],
            team2: blueTeams[1],
            team3: blueTeams[2],
          });

          // adjusted for overscouting

          if (redAlliance.totalPoints >= 120) {
            redRPs += 1;
          }
          if (blueAlliance.totalPoints >= 120) {
            blueRPs += 1;
          }
          if (redAlliance.totalPoints >= 400) {
            redRPs += 1;
          }
          if (blueAlliance.totalPoints >= 400) {
            blueRPs += 1;
          }

          const redWins = matchPrediction.winningAlliance === 0;

          if (redWins) {
            redRPs += 3;
          } else {
            blueRPs += 3;
          }

          for (const team of redTeams) {
            if (redWins) {
              teams[team].wins += 1;
            } else {
              teams[team].losses += 1;
            }
            teams[team].rankingPoints += redRPs;
            teams[team].matchesPlayed += 1;
            teams[team].combinedScore += redAlliance.totalPoints * 0.9;
            teams[team].highScore = Math.max(
              teams[team].highScore,
              redAlliance.totalPoints * 0.9,
            );
          }

          for (const team of blueTeams) {
            if (redWins) {
              teams[team].losses += 1;
            } else {
              teams[team].wins += 1;
            }
            teams[team].rankingPoints += blueRPs;
            teams[team].matchesPlayed += 1;
            teams[team].combinedScore += blueAlliance.totalPoints * 0.9;
            teams[team].highScore = Math.max(
              teams[team].highScore,
              blueAlliance.totalPoints * 0.9,
            );
          }
        }
      }
    }

    for (const teamNumber in teams) {
      const teamData = teams[teamNumber];
      teamData.averageScore =
        teamData.matchesPlayed > 0
          ? teamData.combinedScore / teamData.matchesPlayed
          : 0;
    }

    const rankingArray = Object.values(teams).sort((a, b) => {
      if (b.rankingPoints !== a.rankingPoints) {
        return b.rankingPoints - a.rankingPoints;
      } else if (b.averageScore !== a.averageScore) {
        return b.averageScore - a.averageScore;
      } else if (b.highScore !== a.highScore) {
        return b.highScore - a.highScore;
      }
      return 0;
    });

    return rankingArray;
  },
} as const;

export type QualPredictionArgs = z.infer<typeof config.argsSchema>;
export type QualPredictionResult = z.infer<typeof config.returnSchema>;
export async function qualRankingPredictionLogic(
  user: User,
  args: QualPredictionArgs,
): Promise<QualPredictionResult> {
  return runAnalysis(config, user, args);
}
