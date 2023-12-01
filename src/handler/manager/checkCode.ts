import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";
  

export const checkCode = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {    

        const params = z.object({
            number: z.number().min(0)
        }).safeParse({
            number: Number(req.query.team) 
        })

        if (!params.success) {
            res.status(400).send(params);
            return;
        };
        const teamRegistered = await prismaClient.registeredTeam.findUnique({
            where: {
                number : params.data.number
            }
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


