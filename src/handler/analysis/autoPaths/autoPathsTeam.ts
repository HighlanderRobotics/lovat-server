import prismaClient from "../../../prismaClient.js";
import z from "zod";
import { runAnalysis } from "../analysisFunction.js";
import {
  autoEnd,
  FlippedActionMap,
  FlippedPositionMap,
} from "../analysisConstants.js";
import {
  dataSourceRuleSchema,
  dataSourceRuleToPrismaFilter,
} from "../dataSourceRule.js";
import { User } from "@prisma/client";

interface AutoPosition {
  location: number;
  event: number;
  time?: number;
  quantity?: number;
}

interface AutoData {
  score: number;
  positions: AutoPosition[];
  matchKey: string;
  tournamentName: string;
}

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

const config = {
  argsSchema: z.object({ team: z.number() }),
  returnSchema: z.array(
    z.object({
      positions: z.array(
        z.object({
          location: z.number(),
          event: z.number(),
          time: z.number().optional(),
          quantity: z.number().optional(),
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
  createKey: async (args: { team: number }) => {
    const teamNumber = args.team;
    return {
      key: ["autoPathsTeam", teamNumber.toString()],
      teamDependencies: [teamNumber],
      tournamentDependencies: [],
    };
  },
  calculateAnalysis: async (args: { team: number }, ctx: { user: User }) => {
    const teamNumber = args.team;

    const sourceTnmtFilter = dataSourceRuleToPrismaFilter<string>(
      dataSourceRuleSchema(z.string()).parse(ctx.user.tournamentSourceRule),
    );
    const sourceTeamFilter = dataSourceRuleToPrismaFilter<number>(
      dataSourceRuleSchema(z.number()).parse(ctx.user.teamSourceRule),
    );

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
      orderBy: [
        { teamMatchData: { tournament: { date: "desc" } } },
        { teamMatchData: { matchType: "desc" } },
        { teamMatchData: { matchNumber: "desc" } },
      ],
    });

    const autoPaths: AutoData[] = [];
    for (const report of autoData) {
      const score = report.events.reduce((acc, cur) => acc + cur.points, 0);
      const positions = report.events.map((e) => ({
        location: FlippedPositionMap[e.position],
        event: FlippedActionMap[e.action],
        time: e.time,
        quantity: e.quantity ?? undefined,
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

    autoPaths.forEach((auto) => {
      for (const group of result) {
        if (isSubsetPositions(auto.positions, group.positions)) {
          if (auto.positions.length > group.positions.length) {
            group.positions = auto.positions;
          }

          if (
            group.matches.every((match) => match.matchKey !== auto.matchKey)
          ) {
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
} as const;

export type AutoPathsTeamArgs = z.infer<typeof config.argsSchema>;
export type AutoPathsTeamResult = z.infer<typeof config.returnSchema>;
export async function autoPathsTeam(
  user: User,
  args: AutoPathsTeamArgs,
): Promise<AutoPathsTeamResult> {
  return runAnalysis(config, user, args);
}
