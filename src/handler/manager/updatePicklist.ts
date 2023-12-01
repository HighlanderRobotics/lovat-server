import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";


export const updatePicklist = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = req.user
        const params = z.object({
            name: z.string(),
            avgTotal : z.number(),
            authorId: z.string()
        }).safeParse({
            name: req.body.name,
            avgTotal: req.body.avgTotal,
            authorId : user.id

        })
        if (!params.success) {
            res.status(400).send(params);
            return;
        };
        const row = await prismaClient.sharedPicklist.update({
            where : 
            {
                uuid : req.params.uuid,
                author : {
                    teamNumber : user.teamNumber
                }
            },
            data: {
                name : params.data.name,
                avgTotal : params.data.avgTotal,
                authorId : params.data.authorId
            }
        })
        if(!row)
        {
            res.status(401).send("Not authorized to update this picklist")
            return
        }
        res.status(200).send("picklist updated");
    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};