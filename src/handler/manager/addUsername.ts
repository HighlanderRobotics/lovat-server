import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";
  

export const addUsername = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = req.user

        const row = await prismaClient.user.update({
            where : {
                id : user.id
            },
            data :
            {
                username : String(req.body.username)
            }
        })
        res.status(200).send("username added")
        
    }
    catch(error)
    {
        console.error(error)
        res.status(500).send(error)
    }
    
};


