import axios from "axios";
import prisma from "../prismaClient";
import { PrismaClient } from "@prisma/client";
import { addTournamentMatches } from "../handler/manager/addTournamentMatches";
import { date } from "zod";

export default async function fetchMatches() {
    // upsert current tournaments in the matches table
    //new tournaments are added to the matches table in getMatches (if it doesn't already exist)

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 3);

    const endOfWeek = new Date();
    endOfWeek.setDate(endOfWeek.getDate() + 3);

    const oneWeekAgo = new Date();
    const distinctTournamentKeys = await prisma.teamMatchData.groupBy({
        by: ['tournamentKey'],
        //does within the week
        where :
        {
            tournament :
            {
                date :
                {
                    gte : startOfWeek.toDateString(),
                    lte : endOfWeek.toDateString()
                }
            }
        }
    });
    for(const tournamentKeyRow of distinctTournamentKeys)
    {
        await addTournamentMatches(tournamentKeyRow.tournamentKey)
    }
   
}
