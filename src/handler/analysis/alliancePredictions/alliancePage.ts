import z from "zod";
import { createAnalysisFunction } from "../analysisFunction";
import { FlippedRoleMap, Metric } from "../analysisConstants";
import { arrayAndAverageTeams } from "../coreAnalysis/arrayAndAverageTeams";
import { autoPathsTeam } from "../autoPaths/autoPathsTeam";
import { robotRole } from "../coreAnalysis/robotRole";
import { averageManyFast } from "../coreAnalysis/averageManyFast";

export const alliancePage = createAnalysisFunction({
  argsSchema: [z.number(), z.number(), z.number()],
  usesDataSource: false,
  shouldCache: true,

  createKey: ({ args }) => {
    const [team1, team2, team3] = args;
    return {
      key: ["alliancePage", team1.toString(), team2.toString(), team3.toString()],
      teamDependencies: [team1, team2, team3],
    };
  },

  calculateAnalysis: async ({ args }, ctx) => {
    const [team1, team2, team3] = args;
    const teamPoints = await arrayAndAverageTeams(
      [team1, team2, team3],
      Metric.totalPoints,
      ctx.user,
    );

    const teamOneMainRole =
      FlippedRoleMap[(await robotRole(ctx.user, team1)).mainRole];
    const teamTwoMainRole =
      FlippedRoleMap[(await robotRole(ctx.user, team2)).mainRole];
    const teamThreeMainRole =
      FlippedRoleMap[(await robotRole(ctx.user, team3)).mainRole];

    const teamOneAutoPaths = await autoPathsTeam(ctx.user, team1);
    const teamTwoAutoPaths = await autoPathsTeam(ctx.user, team2);
    const teamThreeAutoPaths = await autoPathsTeam(ctx.user, team3);

    const teamData = await averageManyFast(
      [team1, team2, team3],
      [
        Metric.coralL1,
        Metric.coralL2,
        Metric.coralL3,
        Metric.coralL4,
        Metric.processorScores,
        Metric.netScores,
      ],
      ctx.user,
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
