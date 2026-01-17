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
    outpostIntakes: z.number(),
    totalDefenseTime: z.number(),
    totalFuelOutputted: z.number(),
    feedsPerMatch: z.number(),
    autoPoints: z.number(),
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
        Metric.outpostIntakes,
        Metric.totalDefenseTime,
        Metric.totalFuelOutputted,
        Metric.totalPoints,
        Metric.feedsPerMatch,
        Metric.outpostIntakes,
        Metric.autoPoints,
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
      outpostIntakes:
        teamData[args.team1][Metric.outpostIntakes] +
        teamData[args.team2][Metric.outpostIntakes] +
        teamData[args.team3][Metric.outpostIntakes],
      totalDefenseTime:
        teamData[args.team1][Metric.totalDefenseTime] +
        teamData[args.team2][Metric.totalDefenseTime] +
        teamData[args.team3][Metric.totalDefenseTime],
      totalFuelOutputted:
        teamData[args.team1][Metric.totalFuelOutputted] +
        teamData[args.team2][Metric.totalFuelOutputted] +
        teamData[args.team3][Metric.totalFuelOutputted],
      feedsPerMatch:
        teamData[args.team1][Metric.feedsPerMatch] +
        teamData[args.team2][Metric.feedsPerMatch] +
        teamData[args.team3][Metric.feedsPerMatch],
      autoPoints:
        teamData[args.team1][Metric.autoPoints] +
        teamData[args.team2][Metric.autoPoints] +
        teamData[args.team3][Metric.autoPoints],
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
