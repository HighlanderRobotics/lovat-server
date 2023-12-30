import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";


export const updateSettings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {

        const user = req.user
        const params = z.object({
            teamSource : z.array(z.number()),
            tournamentSource : z.array(z.string())

        }).safeParse({
            teamSource : req.body.teamSource,
            tournamentSource : req.body.tournamentSource

        })
        if (!params.success) {
            res.status(400).send(params);
            return;
        };

        const settingsRow = await prismaClient.user.update({
            where :
            {
                id : req.user.id
            },
            data :
            {
                teamSource : params.data.teamSource,
                tournamentSource : params.data.tournamentSource
            }
        })
        res.status(200).send("Settings sucsessfully updated")



    } catch (error) {
        console.error(error);
        res.status(400).send("Error in deleting data");
    }
};
