import prismaClient from "../../../prismaClient";
import z from "zod";
import { createAnalysisFunction } from "../analysisFunction";
import {
  autoEnd,
  FlippedActionMap,
  FlippedPositionMap,
} from "../analysisConstants";
import {
  dataSourceRuleSchema,
  dataSourceRuleToPrismaFilter,
} from "../dataSourceRule";

interface AutoPosition {
  location: number;
  event: number;
  time?: number;
}

interface AutoData {
  score: number;
  positions: AutoPosition[];
  matchKey: string;
  tournamentName: string;
}

export const autoPathsTeam = createAnalysisFunction({
  argsSchema: z.object({ team: z.number() }),
  returnSchema: z.array(
    z.object({
      positions: z.array(
        z.object({
          location: z.number(),
          event: z.number(),
          time: z.number().optional(),
        }),
      ),
      matches: z.array(
        z.object({ matchKey: z.string(), tournamentName: z.string() }),
      ),
      score: z.array(z.number()),
      frequency: z.number(),
      maxScore: z.number(),
    }),
  ),
  usesDataSource: true,
  shouldCache: true,
  createKey: (args) => {
    const teamNumber = args.team;
    return {
      key: ["autoPathsTeam", teamNumber.toString()],
      teamDependencies: [teamNumber],
      tournamentDependencies: [],
    };
  },
  calculateAnalysis: async (args, ctx) => {
    const teamNumber = args.team;

    const sourceTnmtFilter = dataSourceRuleToPrismaFilter<string>(
      dataSourceRuleSchema(z.string()).parse(ctx.user.tournamentSourceRule),
    );
    const sourceTeamFilter = dataSourceRuleToPrismaFilter<number>(
      dataSourceRuleSchema(z.number()).parse(ctx.user.teamSourceRule),
    );

    // Select relevant data in match order
    const autoData = await prismaClient.scoutReport.findMany({
      where: {
        teamMatchData: {
          teamNumber: teamNumber,
          tournamentKey: sourceTnmtFilter,
        },
        scouter: {
          sourceTeamNumber: sourceTeamFilter,
        },
      },
      select: {
        events: {
          where: {
            time: {
              lte: autoEnd,
            },
          },
        },
        teamMatchKey: true,
        teamMatchData: {
          select: {
            tournament: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      // Most recent first
      orderBy: [
        { teamMatchData: { tournament: { date: "desc" } } },
        { teamMatchData: { matchType: "desc" } },
        { teamMatchData: { matchNumber: "desc" } },
      ],
    });

    // Transform data into position list and score
    const autoPaths: AutoData[] = [];
    for (const report of autoData) {
      const score = report.events.reduce((acc, cur) => acc + cur.points, 0);
      const positions = report.events.map((e) => ({
        location: FlippedPositionMap[e.position],
        event: FlippedActionMap[e.action],
        time: e.time,
      }));

      if (positions.length > 0) {
        autoPaths.push({
          score: score,
          positions: positions,
          matchKey: report.teamMatchKey,
          tournamentName: report.teamMatchData.tournament.name,
        });
      }
    }

    const result: {
      positions: AutoPosition[];
      matches: { matchKey: string; tournamentName: string }[];
      score: number[];
      frequency: number;
      maxScore: number;
    }[] = [];

    // Group autos with frequency and scoring potential
    autoPaths.forEach((auto) => {
      for (const group of result) {
        // If the auto is found within a different group, add to that one instead
        if (isSubsetPositions(auto.positions, group.positions)) {
          if (auto.positions.length > group.positions.length) {
            group.positions = auto.positions;
          }

          if (
            group.matches.every((match) => match.matchKey !== auto.matchKey)
          ) {
            // Add the match and tournament if it isn't already included
            group.matches.push({
              matchKey: auto.matchKey,
              tournamentName: auto.tournamentName,
            });
          }
          group.score.push(auto.score);
          group.frequency++;
          group.maxScore = Math.max(group.maxScore, auto.score);

          return;
        }
      }

      // Create a new group
      result.push({
        positions: auto.positions,
        matches: [
          { matchKey: auto.matchKey, tournamentName: auto.tournamentName },
        ],
        score: [auto.score],
        frequency: 1,
        maxScore: auto.score,
      });
    });

    return result;
  },
});

// Check if one auto path includes another
const isSubsetPositions = (
  listOne: AutoPosition[],
  listTwo: AutoPosition[],
): boolean => {
  const shorter = listOne.length > listTwo.length ? listTwo : listOne;
  const longer = listOne.length > listTwo.length ? listOne : listTwo;

  const result = shorter.every(
    (posA, i) =>
      longer[i].event === posA.event && longer[i].location === posA.location,
  );

  return result;
};
