import prisma from "../prismaClient.js";
import { importTournamentMatches } from "./importTournamentMatches.js";

export default async function importAllTournaments(): Promise<void> {
  const tournaments = await prisma.tournament.findMany({
    where: {
      key: {
        startsWith: "2026",
      },
    },
    select: {
      key: true,
    },
    orderBy: {
      key: "asc",
    },
  });

  let success = 0;
  let failed = 0;

  for (const tournament of tournaments) {
    try {
      await importTournamentMatches(tournament.key);
      success++;
      console.log(`[OK] ${tournament.key}`);
    } catch (error) {
      failed++;
      console.error(`[FAIL] ${tournament.key}:`, error);
    }
  }

  console.log(
    `Done. ${success} success, ${failed} failed (${tournaments.length} total).`,
  );
}
