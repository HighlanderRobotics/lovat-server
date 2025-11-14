import z from "zod";
import { createAnalysisFunction } from "../analysisFunction";
import { FlippedRoleMap, Metric } from "../analysisConstants";
import { arrayAndAverageTeams } from "../coreAnalysis/arrayAndAverageTeams";
import { autoPathsTeam } from "../autoPaths/autoPathsTeam";
import { robotRole } from "../coreAnalysis/robotRole";
import { averageManyFast } from "../coreAnalysis/averageManyFast";
import { RobotRole } from "@prisma/client";

export const alliancePage = createAnalysisFunction({
  argsSchema: [z.number(), z.number(), z.number()],
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
      }),
    ),
    coralL1: z.number(),
    coralL2: z.number(),
    coralL3: z.number(),
    coralL4: z.number(),
    processor: z.number(),
    net: z.number(),
  }),
  usesDataSource: false,
  shouldCache: true,

  createKey: ({ args }) => {
    const [team1, team2, team3] = args;
    return {
      key: [
        "alliancePage",
        team1.toString(),
        team2.toString(),
        team3.toString(),
      ],
      teamDependencies: [team1, team2, team3],
    };
  },

  calculateAnalysis: async ({ args }, ctx) => {
    const [team1, team2, team3] = args;
    const teamPoints = await arrayAndAverageTeams(
      ctx.user,
      [team1, team2, team3],
      Metric.totalPoints,
    );

    const teamOneMainRole =
      FlippedRoleMap[
        (await robotRole(ctx.user, team1)).mainRole ?? RobotRole.IMMOBILE
      ];
    const teamTwoMainRole =
      FlippedRoleMap[
        (await robotRole(ctx.user, team2)).mainRole ?? RobotRole.IMMOBILE
      ];
    const teamThreeMainRole =
      FlippedRoleMap[
        (await robotRole(ctx.user, team3)).mainRole ?? RobotRole.IMMOBILE
      ];

    const teamOneAutoPaths = await autoPathsTeam(ctx.user, team1);
    const teamTwoAutoPaths = await autoPathsTeam(ctx.user, team2);
    const teamThreeAutoPaths = await autoPathsTeam(ctx.user, team3);

    const teamData = await averageManyFast(
      ctx.user,
      [team1, team2, team3],
      [
        Metric.coralL1,
        Metric.coralL2,
        Metric.coralL3,
        Metric.coralL4,
        Metric.processorScores,
        Metric.netScores,
      ],
    );

    //constants: total points, teams {team, role, autoPaths, averagePoints}
    return {
      totalPoints:
        teamPoints[team1].average +
        teamPoints[team2].average +
        teamPoints[team3].average,
      teams: [
        {
          team: team1,
          role: teamOneMainRole,
          averagePoints: teamPoints[team1].average,
          paths: teamOneAutoPaths,
        },
        {
          team: team2,
          role: teamTwoMainRole,
          averagePoints: teamPoints[team2].average,
          paths: teamTwoAutoPaths,
        },
        {
          team: team3,
          role: teamThreeMainRole,
          averagePoints: teamPoints[team3].average,
          paths: teamThreeAutoPaths,
        },
      ],
      coralL1:
        teamData[Metric.coralL1][team1] +
        teamData[Metric.coralL1][team2] +
        teamData[Metric.coralL1][team3],
      coralL2:
        teamData[Metric.coralL2][team1] +
        teamData[Metric.coralL2][team2] +
        teamData[Metric.coralL2][team3],
      coralL3:
        teamData[Metric.coralL3][team1] +
        teamData[Metric.coralL3][team2] +
        teamData[Metric.coralL3][team3],
      coralL4:
        teamData[Metric.coralL4][team1] +
        teamData[Metric.coralL4][team2] +
        teamData[Metric.coralL4][team3],
      processor:
        teamData[Metric.processorScores][team1] +
        teamData[Metric.processorScores][team2] +
        teamData[Metric.processorScores][team3],
      net:
        teamData[Metric.netScores][team1] +
        teamData[Metric.netScores][team2] +
        teamData[Metric.netScores][team3],
    };
  },
});
