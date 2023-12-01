import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";


export const getScouterSchedule = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = req.user
      
        const params = z.object({
            tournamentKey: z.string()
        }).safeParse({
            tournamentKey: req.params.tournament 
        })

        if (!params.success) {
            res.status(400).send(params);
            return;
        };

        const rows = await prismaClient.scouterScheduleShift.findMany({
            where: {
                sourceTeamNumber: user.teamNumber,
                tournamentKey: params.data.tournamentKey

            }
        })
        res.status(200).send(rows);
    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};