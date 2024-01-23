import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";


export const getTeamCode = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
        if(user.role !== "SCOUTING_LEAD")
        {
            res.status(403).send("Not authorized to get the team code")
            return
        }
        const row = await prismaClient.registeredTeam.findUnique({
            where: {
                number : user.teamNumber
            }

        })
        res.status(200).send(row.code);
    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};