import axios from "axios";
import prisma from "../prismaClient";
import { PrismaClient } from "@prisma/client";
import { addTournamentMatches } from "../handler/manager/addTournamentMatches";
import { date } from "zod";

export default async function fetchMatches() {
    // upsert current tournaments in the matches table
    //new tournaments are added to the matches table in getMatches (if it doesn't already exist)
    const distinctTournamentKeys = await prisma.teamMatchData.groupBy({
        by: ['tournamentKey'],
        //DO WITHIN THE WEEK
        // where :
        // {
        //     tournament :
        //     {
        //         date : Date()
        //     }
        // }
    });
    for(const tournamentKeyRow of distinctTournamentKeys)
    {
        await addTournamentMatches(tournamentKeyRow.tournamentKey)
    }
   
}
