import { User } from "@prisma/client";
import { RequestHandler } from "express";
import z from "zod";
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";
import prismaClient from "../../prismaClient";

const dataSourceRuleSchema = <T extends z.ZodString | z.ZodNumber>(
  itemType: T,
) =>
  z.object({
    mode: z.enum(["INCLUDE", "EXCLUDE"]),
    items: z.array(itemType),
  });

export type DataSourceRule<T extends number | string> = {
  mode: "INCLUDE" | "EXCLUDE";
  items: T[];
};

type AnalysisContext = {
  user: User;
  dataSource?: {
    teams: DataSourceRule<number>;
    tournaments: DataSourceRule<string>;
  };
};

type AnalysisParamsSchema<T extends z.ZodObject, U extends z.ZodObject> = {
  body?: T;
  query?: U;
};

type AnalysisParams<T extends z.ZodObject, U extends z.ZodObject> = {
  body: z.infer<T>;
  query: z.infer<U>;
};

export type AnalysisHandlerArgs<
  T extends z.ZodObject,
  U extends z.ZodObject,
> = {
  params: AnalysisParamsSchema<T, U>;
  createKey: (params: AnalysisParams<T, U>) => {
    key: string[];
    teamDependencies: number[];
  };
  calculateAnalysis: (
    params: AnalysisParams<T, U>,
    ctx: AnalysisContext,
  ) => Promise<any>;
  usesDataSource: boolean;
};

export const createAnalysisHandler: <
  T extends z.ZodObject,
  U extends z.ZodObject,
>(
  args: AnalysisHandlerArgs<T, U>,
) => RequestHandler = (args) => {
  return async (req: AuthenticatedRequest, res) => {
    try {
      const params = {
        body: args.params.body?.parse(req.body),
        query: args.params.query?.parse(req.query),
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

      // Make the key - including data source if necessary
      const { key: keyFragments, teamDependencies: teamDeps } =
        args.createKey(params);

      if (args.usesDataSource) {
        keyFragments.push(JSON.stringify(context.dataSource.teams));
        keyFragments.push(JSON.stringify(context.dataSource.tournaments));
      }

      // Check to see if there's already an output in the cache
      const cacheRow = await prismaClient.cachedAnalysis.findUnique({
        where: {
          key: keyFragments.join(":"),
        },
      });

      // If not, calculate, respond, then store in cache

      if (cacheRow === null) {
        try {
          const calculatedAnalysis = await args.calculateAnalysis(
            params,
            context,
          );

          res.status(200).send(calculatedAnalysis);

          try {
            await prismaClient.cachedAnalysis.create({
              data: {
                key: keyFragments.join(":"),
                output: calculatedAnalysis,
                teamDependencies: teamDeps,
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
        res.status(200).send(cacheRow.output);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).send("Invalid parameters");
      } else {
        res.status(500).send("Internal server error");
        console.error(error);
      }
    }
  };
};
