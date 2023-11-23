import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'


export const approveRegisteredTeam = async (req: Request, res: Response): Promise<void> => {
    try {
        //check its coming from Collin

        const ApproveRegisteredTeamSchema = z.object({
            number : z.number().min(0)
        }) 
        const currRegisteredTeam = {
            number: Number(req.params.team)
        }
        const possibleTypeError = ApproveRegisteredTeamSchema.safeParse(currRegisteredTeam)
        if (!possibleTypeError.success) {
            res.status(400).send(possibleTypeError)
            return
        }
           const rows = await prismaClient.registeredTeam.update({
               where: currRegisteredTeam,
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