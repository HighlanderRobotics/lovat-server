import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";

export const addMutablePicklist = async (req: AuthenticatedRequest, res: Response): Promise<void> => {

    try {
        const user = req.user



        const params = z.object({
            name: z.string(),
            teams: z.array(z.number().min(0)),
            authorId: z.string()
        }).safeParse({
            name: req.body.name,
            teams: req.body.teams,
            authorId: user.id
        })

        if (!params.success) {
            res.status(400).send(params);
            return;
        };

        const row = await prismaClient.mutablePicklist.create({
            data: {
                name : params.data.name,
                teams : params.data.teams,
                authorId : params.data.authorId
            }
        });

        res.status(200).send("mutable picklist added");
    } catch (error) {
        console.error(error);
        res.status(400).send(error);
    }

};
