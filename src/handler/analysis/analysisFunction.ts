import z from "zod";
import prismaClient from "../../prismaClient";
import { dataSourceRuleSchema } from "./dataSourceRule";
import { kv } from "../../redisClient";
import { AnalysisContext } from "./analysisConstants";
import { User } from "@prisma/client";

export type AnalysisFunctionParamsSchema<T extends z.ZodObject> = {
  args: T[];
};
export type AnalysisFunctionParams<T extends z.ZodObject> = {
  args: z.infer<T>[];
};

export type AnalysisFunctionArgs<T extends z.ZodObject> = {
  params: AnalysisFunctionParamsSchema<T>;
  createKey: (params: AnalysisFunctionParams<T>) => {
    key: string[];
    teamDependencies?: number[];
    tournamentDependencies?: string[];
  };
  calculateAnalysis: (
    params: AnalysisFunctionParams<T>,
    ctx: AnalysisContext,
  ) => Promise<any>;
  usesDataSource: boolean;
  shouldCache: boolean;
};

export const createAnalysisFunction =
  <T extends z.ZodObject>(args: AnalysisFunctionArgs<T>) =>
  async (user: User, ...passedArgs: any[]) => {
    try {
      const params = {
        args: passedArgs,
      };

      const context: AnalysisContext = {
        user: user,
        dataSource: {
          teams: dataSourceRuleSchema(z.number()).parse(user.teamSourceRule),
          tournaments: dataSourceRuleSchema(z.string()).parse(
            user.tournamentSourceRule,
          ),
        },
      };

      if (!args.shouldCache) {
        try {
          const calculatedAnalysis = await args.calculateAnalysis(
            params,
            context,
          );

          return calculatedAnalysis.error ?? calculatedAnalysis;
        } catch (error) {
          return "error";
          console.error(error);
        }
      }
      // Make the key - including data source if necessary
      const {
        key: keyFragments,
        teamDependencies: teamDeps,
        tournamentDependencies: tournamentDeps,
      } = args.createKey(params);

      const teamSourceRule = dataSourceRuleSchema(z.number()).parse(
        context.dataSource.teams,
      );
      const tournamentSourceRule = dataSourceRuleSchema(z.string()).parse(
        context.dataSource.tournaments,
      );

      if (args.usesDataSource) {
        keyFragments.push(`{${teamSourceRule.mode}:[${teamSourceRule.items}]}`);
        keyFragments.push(
          `{${tournamentSourceRule.mode}:[${tournamentSourceRule.items}]}`,
        );
      }

      const key = ["analysis", "function", ...keyFragments].join(":");

      // Check to see if there's already an output in the cache
      const cacheRow = await kv.get(key);

      // If not, calculate, respond, then store in cache

      if (cacheRow === null) {
        try {
          const calculatedAnalysis = await args.calculateAnalysis(
            params,
            context,
          );

          try {
            await kv.set(
              keyFragments.join(":"),
              JSON.stringify(calculatedAnalysis),
            );

            await prismaClient.cachedAnalysis.create({
              data: {
                key: key,
                teamDependencies: teamDeps ?? [],
                tournamentDependencies: tournamentDeps ?? [],
              },
            });

            return calculatedAnalysis.error ?? calculatedAnalysis;
          } catch (error) {
            console.error(error);
            return 400;
          }
        } catch (error) {
          console.error(error);
          return 400;
        }
      } else {
        return JSON.parse(cacheRow.toString());
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error(error);
        return 400;
      } else {
        console.error(error);
        return 500;
      }
    }
  };
