
import prismaClient from '../../prismaClient'
import z from 'zod'
import { Request, Response } from "express";


export const checkRegisteredTeam = async (req : Request, res : Response) => {
    try {
        const CheckRegisteredTeamSchema = z.object({
            number : z.number().min(0)
        }) 
        const currRegisteredTeam = {
            number: Number(req.params.team)
        }
        const possibleTypeError = CheckRegisteredTeamSchema.safeParse(currRegisteredTeam)
        if (!possibleTypeError.success) {
            res.status(400).send(possibleTypeError)
            return
        }
        
        const row = await prismaClient.registeredTeam.findUnique(
            {
                where: currRegisteredTeam
            }

        )
        if(row === null)
        {
            res.status(200).send("team has not started registration process")
            return
        }
        res.status(200).send(row)


    }
    catch (error) {
        console.error(error)
        res.status(400).send(error);

    }

};
