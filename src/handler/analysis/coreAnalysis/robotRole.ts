import z from "zod";
import { MetricsBreakdown } from "../analysisConstants";
import { nonEventMetric } from "./nonEventMetric";
import { createAnalysisFunction } from "../analysisFunction";

// Finds main robot role for a team
export const robotRole = createAnalysisFunction({
  argsSchema: z.object({ team: z.number() }),
  returnSchema: z.object({ mainRole: z.string().nullable() }),
  usesDataSource: true,
  shouldCache: true,
  createKey: (args) => {
    return {
      key: ["robotRole", args.team.toString()],
      teamDependencies: [args.team],
      tournamentDependencies: [],
    };
  },
  calculateAnalysis: async (args, ctx) => {
    try {
      const roles = await nonEventMetric(ctx.user, {
        team: args.team,
        metric: MetricsBreakdown.robotRole,
      });

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
