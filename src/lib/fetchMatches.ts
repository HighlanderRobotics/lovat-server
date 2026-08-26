import prisma from "../prismaClient.js";
import { addTournamentMatches } from "../handler/manager/addTournamentMatches.js";
import { CURRENT_YEAR } from "../handler/manager/managerConstants.js";

export default async function fetchMatches(): Promise<void> {
  // upsert current tournaments in the matches table
  //new tournaments are added to the matches table in getMatches (if it doesn't already exist)

  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - 3);

  const endOfWeek = new Date();
  endOfWeek.setDate(endOfWeek.getDate() + 3);

  // Bulk-delete all tournaments from previous seasons in a single cascading query,
  // instead of deleting them one-by-one inside addTournamentMatches
  await prisma.tournament.deleteMany({
    where: {
      key: {
        not: { startsWith: CURRENT_YEAR },
      },
    },
  });

  // const oneWeekAgo = new Date();
  const distinctTournaments = await prisma.tournament.groupBy({
    by: ["key"],
    where: {
      key: { startsWith: CURRENT_YEAR },
    },

    //does within the week
    // where: {
    //   tournament: {
    //     date: {
    //       gte: startOfWeek.toDateString(),
    //       lte: endOfWeek.toDateString(),
    //     },
    //   },
    // },
  });

  console.log(distinctTournaments);
  for (const tournamentKeyRow of distinctTournaments) {
    await addTournamentMatches(tournamentKeyRow.key);
  }
  console.log("DONE");
}
fetchMatches();
