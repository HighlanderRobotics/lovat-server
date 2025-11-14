import { RequestHandler } from "express";
import z from "zod";
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";
import prismaClient from "../../prismaClient";
import { dataSourceRuleSchema } from "./dataSourceRule";
import { kv } from "../../redisClient";
import { AnalysisContext } from "./analysisConstants";

export type AnalysisHandlerParamsSchema<
  T extends z.ZodObject,
  U extends z.ZodObject,
  V extends z.ZodObject,
> = {
  body?: T;
  query?: U;
  params?: V;
};
export type AnalysisHandlerParams<
  T extends z.ZodObject,
  U extends z.ZodObject,
  V extends z.ZodObject,
> = {
  body: z.infer<T>;
  query: z.infer<U>;
  params: z.infer<V>;
};

export type AnalysisHandlerArgs<
  T extends z.ZodObject,
  U extends z.ZodObject,
  V extends z.ZodObject,
> = {
  params: AnalysisHandlerParamsSchema<T, U, V>;
  createKey: (params: AnalysisHandlerParams<T, U, V>) => {
    key: string[];
    teamDependencies?: number[];
    tournamentDependencies?: string[];
  };
  calculateAnalysis: (
    params: AnalysisHandlerParams<T, U, V>,
    ctx: AnalysisContext,
  ) => Promise<any>;
  usesDataSource: boolean;
  shouldCache: boolean;
};

export const createAnalysisHandler: <
  T extends z.ZodObject,
  U extends z.ZodObject,
  V extends z.ZodObject,
>(
  args: AnalysisHandlerArgs<T, U, V>,
) => RequestHandler = (args) => {
  return async (req: AuthenticatedRequest, res) => {
    try {
      const params = {
        body: args.params.body?.parse(req.body),
        query: args.params.query?.parse(req.query),
        params: args.params.params?.parse(req.params),
      };

      const context: AnalysisContext = {
        user: req.user,
        dataSource: {
          teams: dataSourceRuleSchema(z.number()).parse(
            req.user.teamSourceRule,
          ),
          tournaments: dataSourceRuleSchema(z.string()).parse(
            req.user.tournamentSourceRule,
          ),
        },
      };

      if (!args.shouldCache) {
        try {
          const calculatedAnalysis = await args.calculateAnalysis(
            params,
            context,
          );

          res.status(200).send(calculatedAnalysis.error ?? calculatedAnalysis);
        } catch (error) {
          res.status(500).send("Error calculating analysis");
          console.error(error);
        } finally {
          return;
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

      const key = ["analysis", "handler", ...keyFragments].join(":");

      // Check to see if there's already an output in the cache
      const cacheRow = await kv.get(key);

      // If not, calculate, respond, then store in cache

      if (cacheRow == null) {
        try {
          const calculatedAnalysis = await args.calculateAnalysis(
            params,
            context,
          );

          res.status(200).send(calculatedAnalysis.error ?? calculatedAnalysis);

          try {
            await kv.set(key, JSON.stringify(calculatedAnalysis), 60 * 60 * 24);

            await prismaClient.cachedAnalysis.create({
              data: {
                key: key,
                teamDependencies: teamDeps ?? [],
                tournamentDependencies: tournamentDeps ?? [],
              },
            });
          } catch (error) {
            console.error(error);
            return;
          }
        } catch (error) {
          res.status(500).send("Error calculating analysis");
          console.error(error);
          return;
        }
      } else {
        res.status(200).send(JSON.parse(cacheRow.toString()));
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).send("Invalid parameters");
        console.error(error);
      } else {
        res.status(500).send("Internal server error");
        console.error(error);
      }
    }
  };
};
