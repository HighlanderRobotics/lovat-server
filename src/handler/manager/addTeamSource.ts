import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../requireAuth";
import { getUser } from "./getUser";


export const addTeamSource = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = await getUser(req, res)
        if(user === null)
        {
            return
        }
        const TeamSourceSchema = z.object({
            tournamentSource : z.array(z.number())
        })
        const currTeamSouce = {tournamentSource : req.body.teamSource}
        const possibleTypeErrorShift = TeamSourceSchema.safeParse(currTeamSouce)
        if (!possibleTypeErrorShift.success) {
            res.status(400).send(possibleTypeErrorShift)
            return
        }  
        const row = await prismaClient.user.update({
            where : {
                id : user.id
            },
            data : currTeamSouce
        })
        res.status(200).send("team source added")
        
    }
    catch(error)
    {
        console.error(error)
        res.status(400).send(error)
    }
    
};


