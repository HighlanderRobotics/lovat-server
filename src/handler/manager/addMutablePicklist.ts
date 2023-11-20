import { Request, Response } from "express";
import prismaClient from '../../prismaClient'


export const addMutablePicklist = async (req: Request, res: Response): Promise<void> => {
    try {
           const rows = await prismaClient.mutablePicklist.create({
            data: {
                name: req.body.name,
                teams: req.body.teams,
                sourceTeam: req.body.sourceTeam,
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