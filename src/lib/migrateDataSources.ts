import { User } from "@prisma/client";
import { DataSourceRule } from "../handler/analysis/dataSourceRule.js";
import {
  allTeamNumbers,
  allTournaments,
} from "../handler/analysis/analysisConstants.js";
import prismaClient from "../prismaClient.js";

export const arrayToRule = <T extends string | number>(
  sources: T[],
  possibleSources: T[],
): DataSourceRule<T> => {
  // If nothing is filtered, don't check
  if (sources.length === possibleSources.length) {
    return { mode: "EXCLUDE", items: [] };
  }

  // Many users will only filter a few out, invert takes advantage of this
  if (sources.length >= possibleSources.length * 0.5) {
    const unsourcedTeams = possibleSources.filter(
      (val) => !sources.includes(val),
    );
    return { mode: "EXCLUDE", items: unsourcedTeams };
  }

  // Case where user only accepts data from some
  return { mode: "INCLUDE", items: sources };
};

const migrateUserDataSources = async (user: User) => {
  await prismaClient.user.update({
    where: {
      id: user.id,
    },
    data: {
      teamSourceRule: arrayToRule<number>(
        user.teamSource,
        await allTeamNumbers,
      ),
      tournamentSourceRule: arrayToRule<string>(
        user.tournamentSource,
        await allTournaments,
      ),
    },
  });
};

export const migrateDataSources = async () => {
  const shouldSkip = (
    await prismaClient.featureToggle.findUnique({
      where: { feature: "skipDataSourceMigration" },
    })
  )?.enabled;

  if (shouldSkip) {
    console.log("Skipping data source migration");
    return;
  }

  const batchSize = 20;
  let processed = 0;
  const totalUsers = await prismaClient.user.count();

  while (processed < totalUsers) {
    const batch = await prismaClient.user.findMany({
      skip: processed,
      take: batchSize,
    });

    await Promise.all(batch.map((user) => migrateUserDataSources(user)));
    processed += batch.length;
    console.log(`Processed ${processed} of ${totalUsers} users`);
  }

  await prismaClient.featureToggle.upsert({
    where: {
      feature: "skipDataSourceMigration",
    },
    create: {
      feature: "skipDataSourceMigration",
      enabled: true,
    },
    update: {
      enabled: true,
    },
  });
};
