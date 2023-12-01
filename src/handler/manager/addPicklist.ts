import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";


export const addPicklist = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const params = z.object({
            name: z.string(),
            avgTotal: z.number(),
            authorId: z.string()
        }).safeParse({
            name: req.body.name,
            avgTotal: req.body.avgTotal,
            authorId: req.user.id
        })
        if (!params.success) {
            res.status(400).send(params);
            return;
        };
   
        const rows = await prismaClient.sharedPicklist.create({
            data: {
                name : params.data.name,
                avgTotal : params.data.avgTotal,
                authorId : params.data.authorId
            }
        })
        res.status(200).send("picklist added");
    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};