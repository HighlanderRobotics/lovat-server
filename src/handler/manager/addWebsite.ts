import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../requireAuth";
import { getUser } from "./getUser";


export const addWebsite = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = await getUser(req, res)
        if(user === null)
        {
            return
        }
        const WebsiteSchema = z.object({
            website : z.string()
        })
        const currWebsite = {website : req.body.website}
        const possibleTypeErrorShift = WebsiteSchema.safeParse(currWebsite)
        if (!possibleTypeErrorShift.success) {
            res.status(400).send(possibleTypeErrorShift)
            return
        }        const row = await prismaClient.registeredTeam.update({
            where : {
                number : user.teamNumber
            },
            data : currWebsite
        })
        res.status(200).send("website added")
        
    }
    catch(error)
    {
        console.error(error)
        res.status(400).send(error)
    }
    
};


