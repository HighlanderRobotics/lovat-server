import z from "zod";
import prismaClient from "../../prismaClient";
import { dataSourceRuleSchema } from "./dataSourceRule";
import { kv } from "../../redisClient";
import { AnalysisContext } from "./analysisConstants";
import { User } from "@prisma/client";

export type AnalysisFunctionParams<T extends z.ZodTypeAny> = {
  args: z.infer<T>[];
};

export type CreateKeyResult = {
  key: string[];
  teamDependencies?: number[];
  tournamentDependencies?: string[];
};

export type AnalysisFunctionConfig<
  T extends z.ZodTypeAny,
  R extends z.ZodTypeAny,
> = {
  argsSchema: T[];
  returnSchema?: R;
  createKey: (params: AnalysisFunctionParams<T>) => CreateKeyResult;
  calculateAnalysis: (
    params: AnalysisFunctionParams<T>,
    ctx: AnalysisContext,
  ) => Promise<z.infer<R>>;
  usesDataSource: boolean;
  shouldCache: boolean;
};
export const createAnalysisFunction =
  <T extends z.ZodTypeAny, R extends z.ZodTypeAny>(
    config: AnalysisFunctionConfig<T, R>,
  ) =>
  async (user: User, ...passedArgs: unknown[]): Promise<z.infer<R>> => {
    if (passedArgs.length !== config.argsSchema.length) {
      throw new Error("Incorrect number of arguments passed.");
    }

    const parsedArgs = passedArgs.map((arg, i) =>
      config.argsSchema[i].parse(arg),
    ) as z.infer<T>[];

    const params: AnalysisFunctionParams<T> = {
      args: parsedArgs,
    };

    const context: AnalysisContext = {
      user,
      dataSource: {
        teams: dataSourceRuleSchema(z.number()).parse(user.teamSourceRule),
        tournaments: dataSourceRuleSchema(z.string()).parse(
          user.tournamentSourceRule,
        ),
      },
    };

    if (!config.shouldCache) {
      return await config.calculateAnalysis(params, context);
    }

    const {
      key: keyFragments,
      teamDependencies,
      tournamentDependencies,
    } = config.createKey(params);

    if (config.usesDataSource) {
      const teamSource = context.dataSource.teams;
      const tournamentSource = context.dataSource.tournaments;
      keyFragments.push(`{${teamSource.mode}:[${teamSource.items}]}`);
      keyFragments.push(
        `{${tournamentSource.mode}:[${tournamentSource.items}]}`,
      );
    }

    const key = ["analysis", "function", ...keyFragments].join(":");
    const cacheRow = await kv.get(key);

    if (!cacheRow) {
      const result = await config.calculateAnalysis(params, context);

      await kv.set(key, JSON.stringify(result));
      await prismaClient.cachedAnalysis.create({
        data: {
          key,
          teamDependencies: teamDependencies ?? [],
          tournamentDependencies: tournamentDependencies ?? [],
        },
      });

      console.log(result);
      return result;
    }

    const parsed = JSON.parse(cacheRow.toString());
    return config.returnSchema
      ? config.returnSchema.parse(parsed)
      : (parsed as z.infer<R>);
  };
