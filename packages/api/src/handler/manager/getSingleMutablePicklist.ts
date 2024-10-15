import { Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
  import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";


export const getSingleMutablePicklist = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = req.user
        
        const params = z.object({
            uuid: z.string()
        }).safeParse({
            uuid: req.params.uuid
        })
        if (!params.success) {
            res.status(400).send(params);
            return;
        };
        const row = await prismaClient.mutablePicklist.findUnique({
           where : {
            uuid : params.data.uuid,
            author: {
                teamNumber : user.teamNumber
            }
           }

        })
        res.status(200).send(row);
    }
    catch(error)
    {
        console.error(error)
        res.status(500).send(error)
    }
    
};