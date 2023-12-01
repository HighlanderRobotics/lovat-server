import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";


export const addTournamentSource = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = req.user
        const params = z.object({
            tournamentSource: z.array(z.string())
        }).safeParse({
            tournamentSource: req.body.tournamentSource
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
                tournamentSource : params.data.tournamentSource
            }
        })
        res.status(200).send("tournament source added")

    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};


