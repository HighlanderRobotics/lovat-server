import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";
import { getUser } from "./getUser";
import { todo } from "node:test";


export const addTeamSource = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = await getUser(req, res)
        if(user === null)
        {
            return
        }

        //CHECK THAT TEAMS ACTUALLY EXIST
        const TeamSourceSchema = z.object({
            teamSource : z.array(z.number())
        })
        const currTeamSource = {teamSource : req.body.teamSource}
        const possibleTypeErrorShift = TeamSourceSchema.safeParse(currTeamSource)
        if (!possibleTypeErrorShift.success) {
            res.status(400).send(possibleTypeErrorShift)
            return
        }  
        const row = await prismaClient.user.update({
            where : {
                id : user.id
            },
            data : currTeamSource
        })
        res.status(200).send("team source added")
        
    }
    catch(error)
    {
        console.error(error)
        res.status(400).send(error)
    }
    
};


