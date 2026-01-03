import z from "zod";
import { MetricsBreakdown } from "@/src/handler/analysis/analysisConstants.js";
import { nonEventMetric, NonEventMetricResult } from "@/src/handler/analysis/coreAnalysis/nonEventMetric.js";
import { runAnalysis, AnalysisFunctionConfig } from "@/src/handler/analysis/analysisFunction.js";
import { User } from "@prisma/client";

const argsSchema = z.object({ team: z.number() });
const returnSchema = z.object({ mainRole: z.string().nullable() });

const config: AnalysisFunctionConfig<typeof argsSchema, typeof returnSchema> = {
  argsSchema,
  returnSchema,
  usesDataSource: true,
  shouldCache: true,
  createKey: (args) => {
    return {
      key: ["robotRole", args.team.toString()],
      teamDependencies: [args.team],
      tournamentDependencies: [],
    };
  },
  calculateAnalysis: async (
    args: z.infer<typeof argsSchema>,
    ctx: { user: User },
  ) => {
    try {
      const roles: NonEventMetricResult = await nonEventMetric(ctx.user, {
        team: args.team,
        metric: MetricsBreakdown.robotRole,
      });

      let eventTypeWithMostOccurrences: string = null;
      let maxCount = 0;

      // Iterate through robot roles
      for (const [type, count] of Object.entries(roles) as [string, number][]) {
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
};

export const robotRole = async (user: User, args: z.infer<typeof argsSchema>) =>
  runAnalysis(config, user, args);
