import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'


export const getTeams = async (req: Request, res: Response): Promise<void> => {
    try {
        const params = z.object({
            take: z.number(),
            skip : z.number(),
            filter : z.string()
        }).safeParse({
            take: Number(req.query.take),
            skip : Number(req.query.skip),
            filter : req.query.filter

        })
        if (!params.success) {
            res.status(400).send(params);
            return;
        };
        const rows = await prismaClient.team.findMany({
            take : params.data.take,
            skip : params.data.skip,
        })
        res.status(200).send(rows);
    }
    catch(error)
    {
        console.error(error)
        res.status(400).send(error)
    }
    
};