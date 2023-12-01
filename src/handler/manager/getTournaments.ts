import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z, { ZodNumber } from 'zod'


export const getTournaments = async (req: Request, res: Response): Promise<void> => {
    try {

        const schema = z.object({
            take : z.number(),
            skip : z.number(),
            filter : z.string()
        })
    


        if (req.filter != null) {
            const rows = await prismaClient.tournament.findMany({
                take: Number(req.query.take),
                skip: Number(req.query.skip),
                where:
                {
                    OR: [{ key: req.query.filter as string }, { name: req.query.filter as string }]
                }


            })
            res.status(200).send(rows);
        }
        else
        {
            const rows = await prismaClient.tournament.findMany({
                take: Number(req.query.take),
                skip: Number(req.query.skip),
                where:
                {
                    OR: [{ key: req.query.filter as string }, { name: req.query.filter as string }]
                }


            })
            res.status(200).send(rows);
        }
    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};