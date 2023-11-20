import { Request, Response } from "express";
import prismaClient from '../../prismaClient'


export const approveRegisteredTeam = async (req: Request, res: Response): Promise<void> => {
    try {
        //check its coming from Collin
           const rows = await prismaClient.registeredTeam.update({
               where: {
                   number: req.body.teamNumber
               },
               data: {
                teamApproved : true
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