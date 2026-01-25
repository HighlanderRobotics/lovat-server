import z from "zod";
import prismaClient from "../../prismaClient.js";
import { dataSourceRuleSchema } from "./dataSourceRule.js";
import { kv } from "../../redisClient.js";
import { AnalysisContext } from "./analysisConstants.js";
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

export async function runAnalysis<T extends z.ZodObject, R extends z.ZodType>(
  config: AnalysisFunctionConfig<T, R>,
  user: User,
  passedArgs: z.infer<T>,
): Promise<z.infer<R>> {
  const teamsRuleResult = dataSourceRuleSchema(z.number()).safeParse(
    user?.teamSourceRule,
  );
  const tournamentsRuleResult = dataSourceRuleSchema(z.string()).safeParse(
    user?.tournamentSourceRule,
  );
  const context: AnalysisContext = {
    user,
    dataSource: {
      teams: teamsRuleResult.success
        ? teamsRuleResult.data
        : { mode: "INCLUDE", items: [] },
      tournaments: tournamentsRuleResult.success
        ? tournamentsRuleResult.data
        : { mode: "INCLUDE", items: [] },
    },
  };

  const roundAllNumbers = <T>(val: T): T => {
    if (val === null || val === undefined) return val;
    if (typeof val === "number") {
      const n = val as unknown as number;
      if (!Number.isFinite(n)) return 0 as T;
      return (Math.round(n * 100) / 100) as T;
    }
    if (Array.isArray(val)) return val.map(roundAllNumbers) as T;
    if (typeof val === "object") {
      const out: Record<string, unknown> = {};
      for (const k of Object.keys(val as Record<string, unknown>)) {
        out[k] = roundAllNumbers((val as Record<string, unknown>)[k]);
      }
      return out as T;
    }
    return val as T;
  };

  if (!config.shouldCache) {
    const fresh = await config.calculateAnalysis(passedArgs, context);
    const rounded = roundAllNumbers(fresh);
    return rounded;
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
    keyFragments.push(`{${tournamentSource.mode}:[${tournamentSource.items}]}`);
  }

  const key = ["analysis", "function", ...keyFragments].join(":");
  const cacheRow = await kv.get(key);

  if (!cacheRow) {
    const result = await config.calculateAnalysis(passedArgs, context);
    const rounded = roundAllNumbers(result);

    await kv.set(key, JSON.stringify(rounded));
    await prismaClient.cachedAnalysis.create({
      data: {
        key,
        teamDependencies: teamDependencies ?? [],
        tournamentDependencies: tournamentDependencies ?? [],
      },
    });

    return rounded as z.infer<R>;
  }

  const parsed = JSON.parse(cacheRow.toString());
  if (config.returnSchema) {
    try {
      return config.returnSchema.parse(parsed);
    } catch (e) {
      const fresh = await config.calculateAnalysis(passedArgs, context);
      const rounded = roundAllNumbers(fresh);
      await kv.set(key, JSON.stringify(rounded));
      return rounded as z.infer<R>;
    }
  }
  return parsed as z.infer<R>;
}

export const createAnalysisFunction =
  <T extends z.ZodObject, R extends z.ZodType>(
    config: AnalysisFunctionConfig<T, R>,
  ) =>
  async (user: User, passedArgs: z.infer<T>): Promise<z.infer<R>> => {
    return runAnalysis(config, user, passedArgs);
  };
