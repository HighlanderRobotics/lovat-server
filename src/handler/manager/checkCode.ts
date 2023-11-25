import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../requireAuth";
 

export const checkCode = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = req.user
    
        const TeamSchema = z.object({
            number: z.number().min(0)
        })
        const currTeam = { number: Number(req.query.team) }
        const possibleTypeError = TeamSchema.safeParse(currTeam)
        if (!possibleTypeError.success) {
            res.status(400).send(possibleTypeError)
            return
        }
        const teamRegistered = await prismaClient.registeredTeam.findUnique({
            where: currTeam
        })
        if (teamRegistered) {
            if(teamRegistered.code === req.query.code)
            {
                res.status(200).send(true)
            }
            else
            {
                res.status(401).send(false)
            }


        }
        else
        {
            res.status(401).send("team not found")

        }

    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};


