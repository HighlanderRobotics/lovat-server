import prisma from "../prismaClient";
import fetchTournaments from "./fetchTournaments";
import fetchTeams from "./fetchTeams";
import fetchMatches from "./fetchMatches";


export default async function getTBAData() {
    // If we don't have any tournaments, fetch them from TBA
    const tournaments = await prisma.tournament.findMany();

    if (tournaments.length === 0) {
        console.log("No tournaments found in database. Fetching from TBA...");
        await fetchTournaments();
        console.log("Done fetching tournaments from TBA.");
    }

    // If we don't have any teams, fetch them from TBA
    const teams = await prisma.team.findMany();

    if (teams.length === 0) {
        console.log("No teams found in database. Fetching from TBA...");
        await fetchTeams();
        console.log("Done fetching teams from TBA.");
    }


    // Repeat this daily //could we do hourly? So that elim matches update in a timly manner, we could do it seperatly too
    setInterval(async () => {
        console.log("Fetching tournaments from TBA...");
        await fetchTournaments();
        console.log("Done fetching tournaments from TBA.");

        console.log("Fetching teams from TBA...");
        await fetchTeams();
        console.log("Done fetching teams from TBA.")
        
        console.log("Fetching matches from TBA...");
        await fetchMatches();
        console.log("Done fetching matches from TBA.");

    }, 1000 * 60 * 60 * 24);
}
