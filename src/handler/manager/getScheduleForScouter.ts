import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";


export const getScheduleForScouter = async (req: Request, res: Response): Promise<void> => {
    try {
        const params = z.object({
            uuid: z.string(),
            tournament : z.string()
        }).safeParse({
            uuid: req.params.uuid,
            tournament : req.params.tournament
        })
        if (!params.success) {
            res.status(400).send(params);
            return;
        };
        const scouter = await prismaClient.scouter.findUnique({
            where : {
                uuid : params.data.uuid
            }
        })
        const rows = await prismaClient.scouterScheduleShift.findMany({
            where:
            {
                sourceTeamNumber : scouter.sourceTeamNumber,
                tournamentKey : params.data.tournament
            }

        })
        res.status(200).send(rows);
    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};