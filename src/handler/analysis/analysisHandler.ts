import { RequestHandler } from "express";
import z from "zod";
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth.js";
import prismaClient from "../../prismaClient.js";
import { dataSourceRuleSchema } from "./dataSourceRule.js";
import { kv } from "../../redisClient.js";
import { AnalysisContext } from "./analysisConstants.js";
import { CreateKeyResult } from "./analysisFunction.js";

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
  createKey: (
    params: AnalysisHandlerParams<T, U, V>,
    ctx: AnalysisContext,
  ) => Promise<CreateKeyResult> | CreateKeyResult;
  calculateAnalysis: (
    params: AnalysisHandlerParams<T, U, V>,
    ctx: AnalysisContext,
  ) => Promise<any>;
  // Optional hook run after the cache read on both hit and miss paths (and on
  // the shouldCache:false path) whenever the result has no .error. Its return
  // value is sent to the client but is NEVER written to the cache — the cache
  // always stores the raw calculated result.
  augmentResponse?: (
    params: AnalysisHandlerParams<T, U, V>,
    ctx: AnalysisContext,
    result: any,
  ) => Promise<any> | any;
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
          let calculatedAnalysis = null;
          calculatedAnalysis = await args.calculateAnalysis(params, context);

          let responseBody = calculatedAnalysis.error ?? calculatedAnalysis;
          if (!calculatedAnalysis.error && args.augmentResponse) {
            responseBody = await args.augmentResponse(
              params,
              context,
              calculatedAnalysis,
            );
          }

          res.status(200).send(responseBody);
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
      } = await args.createKey(params, context);

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

      if (cacheRow === null || cacheRow === undefined) {
        try {
          const calculatedAnalysis = await args.calculateAnalysis(
            params,
            context,
          );

          let responseBody = calculatedAnalysis.error ?? calculatedAnalysis;
          if (!calculatedAnalysis.error && args.augmentResponse) {
            responseBody = await args.augmentResponse(
              params,
              context,
              calculatedAnalysis,
            );
          }

          res.set("X-Lovat-Cache", "miss");
          res.status(200).send(responseBody);

          try {
            await kv.set(key, JSON.stringify(calculatedAnalysis));

            try {
              await prismaClient.cachedAnalysis.create({
                data: {
                  key: key,
                  teamDependencies: teamDeps ?? [],
                  tournamentDependencies: tournamentDeps ?? [],
                },
              });
            } catch (e: any) {
              if (e?.code !== "P2002") throw e;
              // Ignore duplicate key; another request already created the row
            }
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
        const cachedAnalysis = JSON.parse(cacheRow.toString());

        let responseBody = cachedAnalysis.error ?? cachedAnalysis;
        if (!cachedAnalysis.error && args.augmentResponse) {
          responseBody = await args.augmentResponse(
            params,
            context,
            cachedAnalysis,
          );
        }

        res.set("X-Lovat-Cache", "hit");
        res.status(200).send(responseBody);
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
