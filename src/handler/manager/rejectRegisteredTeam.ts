import { Request, Response } from "express";
import prismaClient from '../../prismaClient'


export const rejectRegisteredTeam = async (req: Request, res: Response): Promise<void> => {
    try {
        //check its coming from Collin
           const rows = await prismaClient.registeredTeam.delete({
               where: {
                   number: req.body.teamNumber
               },
               
           })
        res.status(200).send(`Team ${req.body.teamNumber} removed`);
    }
    catch(error)
    {
        console.error(error)
        res.status(400).send(error)
    }
    
};