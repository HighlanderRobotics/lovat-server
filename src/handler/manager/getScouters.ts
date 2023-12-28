import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";


export const getScouters = async (req: Request, res: Response): Promise<void> => {
    try {
      
        const params = z.object({
            scouterUuid: z.string()
        }).safeParse({
            scouterUuid: req.query.scouterUuid 
        })

        if (!params.success) {
            res.status(400).send(params);
            return;
        };
        const team = await prismaClient.scouter.findUnique({
            where : 
            {
                uuid : params.data.scouterUuid
            }
        })
        const rows = await prismaClient.scouter.findMany({
            where: {
                sourceTeamNumber : team.sourceTeamNumber
            }
        })
        res.status(200).send(rows);
    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};