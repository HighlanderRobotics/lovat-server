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
           const row = await prismaClient.registeredTeam.findUnique({
               where: {
                code : params.data.code
               }
           })
           if(row === null)
           {
            res.status(404).send("CODE_NOT_RECOGNIZED")
           }
           else if(row.emailVerified)
           {
            res.status(400).send("EMAIL_ALREADY_VERIFIED")
           }
           else
           {
                const changeRow = await prismaClient.registeredTeam.update({
                    where : {
                        code : params.data.code
                    },
                    data : 
                    {
                        emailVerified : true
                    }
                })
                res.status(200).send("Team email sucsessfully verified")

           }
    }
    catch(error)
    {
        console.error(error)
        res.status(500).send(error)
    }
    
};