import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
 import { AuthenticatedRequest } from "../../requireAuth";


export const getMutablePicklists = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = req.user

           const rows = await prismaClient.mutablePicklist.findMany({
            where: {
                author :
                {
                    teamNumber : user.teamNumber
                } 
            }
            
        })
        res.status(200).send(rows);
    }
    catch(error)
    {
        console.error(error)
        res.status(400).send(error)
    }
    
};