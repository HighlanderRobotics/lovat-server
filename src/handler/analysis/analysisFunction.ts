import z from "zod";
import prismaClient from "../../prismaClient";
import { dataSourceRuleSchema } from "./dataSourceRule";
import { kv } from "../../redisClient";
import { AnalysisContext } from "./analysisConstants";
import { User } from "@prisma/client";

export type CreateKeyResult = {
  key: string[];
  teamDependencies?: number[];
  tournamentDependencies?: string[];
};

export type AnalysisFunctionConfig<
  T extends z.ZodObject,
  R extends z.ZodType,
> = {
  argsSchema: T;
  returnSchema?: R;
  createKey: (params: z.infer<T>) => CreateKeyResult;
  calculateAnalysis: (
    params: z.infer<T>,
    ctx: AnalysisContext,
  ) => Promise<z.infer<R>>;
  usesDataSource: boolean;
  shouldCache: boolean;
};
export const createAnalysisFunction =
  <T extends z.ZodObject, R extends z.ZodType>(
    config: AnalysisFunctionConfig<T, R>,
  ) =>
  async (user: User, passedArgs: z.infer<T>): Promise<z.infer<R>> => {
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
      return await config.calculateAnalysis(passedArgs, context);
    }

    const {
      key: keyFragments,
      teamDependencies,
      tournamentDependencies,
    } = config.createKey(passedArgs);

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
      const result = await config.calculateAnalysis(passedArgs, context);

      await kv.set(key, JSON.stringify(result));
      await prismaClient.cachedAnalysis.create({
        data: {
          key,
          teamDependencies: teamDependencies ?? [],
          tournamentDependencies: tournamentDependencies ?? [],
        },
      });
      return result;
    }

    const parsed = JSON.parse(cacheRow.toString());
    return config.returnSchema
      ? config.returnSchema.parse(parsed)
      : (parsed as z.infer<R>);
  };
