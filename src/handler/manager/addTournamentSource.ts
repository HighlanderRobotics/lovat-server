import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../requireAuth";
import { getUser } from "./getUser";


export const addTournamentSource = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = await getUser(req, res)
        if(user === null)
        {
            return
        }
        const row = await prismaClient.user.update({
            where : {
                id : user.id
            },
            data :
            {
                tou
            }
        })
        res.status(200).send("username added")
        
    }
    catch(error)
    {
        console.error(error)
        res.status(400).send(error)
    }
    
};


