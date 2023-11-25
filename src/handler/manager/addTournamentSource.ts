import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../requireAuth";
 

export const addTournamentSource = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = req.user

        const TournamentSouceSchema = z.object({
            tournamentSource : z.array(z.string())
        })
        const currTournamentSource = {tournamentSource : req.body.tournamentSource}
        const possibleTypeError = TournamentSouceSchema.safeParse(currTournamentSource)
        if (!possibleTypeError.success) {
            res.status(400).send(possibleTypeError)
            return
        }  
        const row = await prismaClient.user.update({
            where : {
                id : user.id
            },
            data : currTournamentSource
        })
        res.status(200).send("tournament source added")
        
    }
    catch(error)
    {
        console.error(error)
        res.status(400).send(error)
    }
    
};


