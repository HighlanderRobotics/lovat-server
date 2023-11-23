import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'


export const rejectRegisteredTeam = async (req: Request, res: Response): Promise<void> => {
    try {
        //check its coming from Collin
        const RegisteredTeamSchema = z.object({
            number : z.number().min(0)
        })
        const currRegistedTeam = {
            number : Number(req.params.team)
        }
        const possibleTypeError = RegisteredTeamSchema.safeParse(currRegistedTeam)
        if (!possibleTypeError.success) {
            res.status(400).send(possibleTypeError)
            return
        }
           const rows = await prismaClient.registeredTeam.delete({
               where: currRegistedTeam,
               
           })
        res.status(200).send(`Team ${req.body.teamNumber} removed`);
    }
    catch(error)
    {
        console.log(error)
        res.status(400).send(error)
    }
    
};