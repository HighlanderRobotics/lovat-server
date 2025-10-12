import fetchTournaments from "./fetchTournaments";
import fetchTeams from "./fetchTeams";
import fetchMatches from "./fetchMatches";
import prisma from "../prismaClient";

export default async function getTBAData(): Promise<void> {
  const year = 2024;
  const devEnabled = process.env.NODE_ENV === "development";

  // Prevent fetch on auto-restart in dev mode
  const skipInitialFetch =
    devEnabled &&
    (await prisma.tournament.count()) > 0 &&
    (await prisma.team.count()) > 0;

  if (!skipInitialFetch) {
    // Import tournaments
    console.log("Fetching tournaments from TBA...");
    await fetchTournaments(year);
    console.log("Done fetching tournaments from TBA.");

    // Import teams
    console.log("Fetching teams from TBA...");
    await fetchTeams();
    console.log("Done fetching teams from TBA.");
  }

  // repeat every 24 hours
  setInterval(async () => {
    console.log("Fetching tournaments from TBA...");
    await fetchTournaments(year);
    console.log("Done fetching tournaments from TBA.");

    console.log("Fetching teams from TBA...");
    await fetchTeams();
    console.log("Done fetching teams from TBA.");
  }, 1000 * 60 * 60 * 24);
  //repeat hourly
  setInterval(async () => {
    await fetchMatches();
    console.log("Done fetching matches from TBA.");
  }, 1000 * 60 * 60);
}
