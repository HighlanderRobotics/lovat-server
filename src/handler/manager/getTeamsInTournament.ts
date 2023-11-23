import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'


export const getTeamsInTournament = async (req: Request, res: Response): Promise<void> => {
    try {
        const TournamentSchema = z.object({
            tournament : z.string()
        })
        const currTournament = 
        {
            tournamentKey : req.params.key
        }
        const possibleTypeError = TournamentSchema.safeParse(currTournament)
        if (!possibleTypeError.success) {
            res.status(400).send(possibleTypeError)
            return
        }
        
        const rows = await prismaClient.teamMatchData.findMany({
            where: currTournament,
            select: {
                teamNumber: true
            }
        });
        if(!rows)
        {
            res.status(404).send("Tournament or teams not found")
        }
    

        const uniqueTeamNumbers = Array.from(new Set(rows.map(row => row.teamNumber)));

        res.status(200).send(uniqueTeamNumbers);
    }
    catch (error) {
        console.error(error);
        res.status(400).send(error);
    }
};
    
