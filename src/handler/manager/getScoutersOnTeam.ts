import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";


export const getScoutersOnTeam = async (req: Request, res: Response): Promise<void> => {
    try {
      
        const params = z.object({
            team : z.number()
        }).safeParse({
            team : Number(req.params.team)
        })

        if (!params.success) {
            res.status(400).send(params);
            return;
        };

        const rows = await prismaClient.scouter.findMany({
            where: {
                sourceTeamNumber : params.data.team
            }
        })
        res.status(200).send(rows);
    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};