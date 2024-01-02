import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";


export const getScheduleForScouter = async (req: Request, res: Response): Promise<void> => {
    try {
        const params = z.object({
            team: z.number(),
            tournament : z.string()
        }).safeParse({
            team: Number(req.params.team),
            tournament : req.params.tournament
        })
        if (!params.success) {
            res.status(400).send(params);
            return;
        };
        const rows = await prismaClient.scouterScheduleShift.findMany({
            where:
            {
                sourceTeamNumber : params.data.team,
                tournamentKey : params.data.tournament,
            }

        })
        res.status(200).send(rows);
    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};