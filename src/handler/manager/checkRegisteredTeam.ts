
import prismaClient from '../../prismaClient'
import z from 'zod'
import { Request, Response } from "express";


export const checkRegisteredTeam = async (req : Request, res : Response) => {
    try {
    
        const params = z.object({
            number: z.number().min(0)
        }).safeParse({
            number: Number(req.params.team)
        })

        if (!params.success) {
            res.status(400).send(params);
            return;
        };
        
        const row = await prismaClient.registeredTeam.findUnique(
            {
                where: {
                    number : params.data.number
                }
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
