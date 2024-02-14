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
            authorId: z.string(),
            tournamentKey : z.string().optional()
        }).safeParse({
            name: req.body.name,
            teams: req.body.teams,
            authorId: user.id,
            tournamentKey :  req.body.tournamnetKey
        })

        if (!params.success) {
            res.status(400).send(params);
            return;
        };

        const row = await prismaClient.mutablePicklist.create({
            data: {
                name : params.data.name,
                teams : params.data.teams,
                authorId : params.data.authorId,
                tournamentKey : params.data.tournamentKey
            }
        });
        res.status(200).send("mutable picklist added");
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }

};
