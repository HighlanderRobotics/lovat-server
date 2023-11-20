import { Request, Response } from "express";
import prismaClient from '../../prismaClient'


export const getMutablePicklists = async (req: Request, res: Response): Promise<void> => {
    try {
        let userID = "change later"
           const rows = await prismaClient.mutablePicklist.findMany({
            where: {
                sourceTeam : {
                    email : userID
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