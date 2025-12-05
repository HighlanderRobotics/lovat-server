import prismaClient from "../prismaClient.js";
import { kv } from "../redisClient.js";

export const clearCache = async () => {
  await prismaClient.cachedAnalysis.deleteMany();

  kv.flush();

  console.log("Cache cleared");
};

export const invalidateCache = async (
  teams: number | number[],
  tournaments: string | string[],
): Promise<void> => {
  const teamsClause = Array.isArray(teams)
    ? { hasSome: teams }
    : { has: teams };
  const tournamentsClause = Array.isArray(tournaments)
    ? { hasSome: tournaments }
    : { has: tournaments };

  const analysisRows = await prismaClient.cachedAnalysis.findMany({
    where: {
      teamDependencies: teamsClause,
      tournamentDependencies: tournamentsClause,
    },
    select: { key: true },
  });

  if (analysisRows.length > 0) {
    const keysToDelete = analysisRows.map((row) => row.key);

    kv.del(keysToDelete);

    await prismaClient.cachedAnalysis.deleteMany({
      where: { key: { in: keysToDelete } },
    });
  }
};
