import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'


export const approveTeamEmail = async (req: Request, res: Response): Promise<void> => {
    try {
        //check its coming from Collin

        
        const params = z.object({
            code : z.string()
        }).safeParse({
            code: req.body.code
        })

        if (!params.success) {
            res.status(400).send(params);
            return;
        };
           const rows = await prismaClient.registeredTeam.update({
               where: {
                code : params.data.code
               },
               data: {
                emailVerified : true
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