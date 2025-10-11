import fetchTournaments from "./fetchTournaments";
import fetchTeams from "./fetchTeams";
import fetchMatches from "./fetchMatches";

export default async function getTBAData(): Promise<void> {
  const year = 2024;
  // Import tournaments
  console.log("Fetching tournaments from TBA...");
  await fetchTournaments(year);
  console.log("Done fetching tournaments from TBA.");

  // Import teams
  console.log("Fetching teams from TBA...");
  await fetchTeams();
  console.log("Done fetching teams from TBA.");

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
