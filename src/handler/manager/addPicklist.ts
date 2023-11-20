import { Request, Response } from "express";
import prismaClient from '../../prismaClient'


export const addPicklist = async (req: Request, res: Response): Promise<void> => {
    try {
           const rows = await prismaClient.sharedPicklist.create({
            data: {
                name : req.body.name,
                avgTotal : req.body.avgTotal,
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