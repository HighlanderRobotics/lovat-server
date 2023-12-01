import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";
import { todo } from "node:test";


export const addTeamSource = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = req.user


        //CHECK THAT TEAMS ACTUALLY EXIST

        const params = z.object({
            teamSource: z.array(z.number())
        }).safeParse({
            teamSource: req.body.teamSource
        })

        if (!params.success) {
            res.status(400).send(params);
            return;
        };
        const row = await prismaClient.user.update({
            where: {
                id: user.id
            },
            data: {
                teamSource : params.data.teamSource
            }
        })
        res.status(200).send("team source added")

    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};


