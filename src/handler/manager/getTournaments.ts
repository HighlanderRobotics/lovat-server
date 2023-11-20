import { Request, Response } from "express";
import prismaClient from '../../prismaClient'


export const getTournaments = async (req: Request, res: Response): Promise<void> => {
    try {
           const rows = await prismaClient.tournament.findMany({
           
        })
        res.status(200).send(rows);
    }
    catch(error)
    {
        console.error(error)
        res.status(400).send(error)
    }
    
};