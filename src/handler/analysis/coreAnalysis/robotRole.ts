import z from "zod";
import { MetricsBreakdown } from "../analysisConstants";
import { nonEventMetric } from "./nonEventMetric";
import { createAnalysisFunction } from "../analysisFunction";

// Finds main robot role for a team
export const robotRole = createAnalysisFunction({
  argsSchema: [z.number()],
  returnSchema: z.object({ mainRole: z.string().nullable() }),
  usesDataSource: true,
  shouldCache: true,
  createKey: ({ args }) => {
    const [team] = args as [number];
    return {
      key: ["robotRole", team.toString()],
      teamDependencies: [team],
      tournamentDependencies: [],
    };
  },
  calculateAnalysis: async ({ args }, ctx) => {
    const [team] = args as [number];
    try {
      const roles = await nonEventMetric(
        ctx.user,
        team,
        MetricsBreakdown.robotRole,
      );

      let eventTypeWithMostOccurrences: string = null;
      let maxCount = 0;

      // Iterate through robot roles
      for (const [type, count] of Object.entries(roles)) {
        if (count > maxCount) {
          maxCount = count;
          eventTypeWithMostOccurrences = type;
        }
      }

      return {
        mainRole: eventTypeWithMostOccurrences,
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
});
