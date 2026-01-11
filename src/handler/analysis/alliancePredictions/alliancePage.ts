import z from "zod";
import { runAnalysis } from "../analysisFunction.js";
import { FlippedRoleMap, Metric } from "../analysisConstants.js";
import { arrayAndAverageTeams } from "../coreAnalysis/arrayAndAverageTeams.js";
import { autoPathsTeam } from "../autoPaths/autoPathsTeam.js";
import { robotRole } from "../coreAnalysis/robotRole.js";
import { averageManyFast } from "../coreAnalysis/averageManyFast.js";
import { RobotRole, User } from "@prisma/client";

const config = {
  argsSchema: z.object({
    team1: z.number(),
    team2: z.number(),
    team3: z.number(),
  }),
  returnSchema: z.object({
    totalPoints: z.number(),
    teams: z.array(
      z.object({
        team: z.number(),
        role: z.number(),
        averagePoints: z.number(),
        paths: z.array(
          z.object({
            positions: z.array(
              z.object({
                location: z.number(),
                event: z.number(),
                time: z.number().optional(),
              })
            ),
            matches: z.array(
              z.object({ matchKey: z.string(), tournamentName: z.string() })
            ),
            score: z.array(z.number()),
            frequency: z.number(),
            maxScore: z.number(),
          })
        ),
      })
    ),
    fuelScored: z.number(),
    feedsFromNeutral: z.number(),
    feedsFromOpponent: z.number(),
    campDefends: z.number(),
    blockDefends: z.number(),
  }),
  usesDataSource: true,
  shouldCache: true,

  createKey: (args) => {
    return {
      key: [
        "alliancePage",
        args.team1.toString(),
        args.team2.toString(),
        args.team3.toString(),
      ],
      teamDependencies: [args.team1, args.team2, args.team3],
    };
  },

  calculateAnalysis: async (args, ctx) => {
    const teamPoints = await arrayAndAverageTeams(ctx.user, {
      teams: [args.team1, args.team2, args.team3],
      metric: Metric.totalPoints,
    });

    const teamOneMainRole =
      FlippedRoleMap[
        (await robotRole(ctx.user, { team: args.team1 })).mainRole ??
          RobotRole.IMMOBILE
      ];
    const teamTwoMainRole =
      FlippedRoleMap[
        (await robotRole(ctx.user, { team: args.team2 })).mainRole ??
          RobotRole.IMMOBILE
      ];
    const teamThreeMainRole =
      FlippedRoleMap[
        (await robotRole(ctx.user, { team: args.team3 })).mainRole ??
          RobotRole.IMMOBILE
      ];

    const teamOneAutoPaths = await autoPathsTeam(ctx.user, {
      team: args.team1,
    });
    const teamTwoAutoPaths = await autoPathsTeam(ctx.user, {
      team: args.team2,
    });
    const teamThreeAutoPaths = await autoPathsTeam(ctx.user, {
      team: args.team3,
    });

    const teamData = await averageManyFast(ctx.user, {
      teams: [args.team1, args.team2, args.team3],
      metrics: [
        Metric.fuelScored,
        Metric.feedsFromNeutral,
        Metric.feedsFromOpponent,
        Metric.campDefends,
        Metric.blockDefends,
      ],
    });

    return {
      totalPoints:
        teamPoints[args.team1].average +
        teamPoints[args.team2].average +
        teamPoints[args.team3].average,
      teams: [
        {
          team: args.team1,
          role: teamOneMainRole,
          averagePoints: teamPoints[args.team1].average,
          paths: teamOneAutoPaths,
        },
        {
          team: args.team2,
          role: teamTwoMainRole,
          averagePoints: teamPoints[args.team2].average,
          paths: teamTwoAutoPaths,
        },
        {
          team: args.team3,
          role: teamThreeMainRole,
          averagePoints: teamPoints[args.team3].average,
          paths: teamThreeAutoPaths,
        },
      ],
      fuelScored:
        (teamData[Metric.fuelScored][args.team1] ?? 0) +
        (teamData[Metric.fuelScored][args.team2] ?? 0) +
        (teamData[Metric.fuelScored][args.team3] ?? 0),
      feedsFromNeutral:
        (teamData[Metric.feedsFromNeutral][args.team1] ?? 0) +
        (teamData[Metric.feedsFromNeutral][args.team2] ?? 0) +
        (teamData[Metric.feedsFromNeutral][args.team3] ?? 0),
      feedsFromOpponent:
        (teamData[Metric.feedsFromOpponent][args.team1] ?? 0) +
        (teamData[Metric.feedsFromOpponent][args.team2] ?? 0) +
        (teamData[Metric.feedsFromOpponent][args.team3] ?? 0),
      campDefends:
        (teamData[Metric.campDefends][args.team1] ?? 0) +
        (teamData[Metric.campDefends][args.team2] ?? 0) +
        (teamData[Metric.campDefends][args.team3] ?? 0),
      blockDefends:
        (teamData[Metric.blockDefends][args.team1] ?? 0) +
        (teamData[Metric.blockDefends][args.team2] ?? 0) +
        (teamData[Metric.blockDefends][args.team3] ?? 0),
    };
  },
} as const;

export type AlliancePageArgs = { team1: number; team2: number; team3: number };
export type AlliancePageResult = z.infer<typeof config.returnSchema>;
export async function alliancePage(
  user: User,
  args: AlliancePageArgs
): Promise<AlliancePageResult> {
  return runAnalysis(config, user, args);
}
