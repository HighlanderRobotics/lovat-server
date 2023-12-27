import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";


export const addNameScouter = async (req: Request, res: Response): Promise<void> => {
    try {

        const params = z.object({
            uuid: z.string(),
            name : z.string()
        }).safeParse({
            uuid: req.body.uuid,
            name : req.body.name
        })
        if (!params.success) {
            res.status(400).send(params);
            return;
        };
        const user = await prismaClient.scouter.update({
            where : 
            {
                uuid : params.data.uuid
            },
            data :
            {
                name : params.data.name
            }
        })
        res.status(200).send("done adding name to provided scouter")
    

    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};


