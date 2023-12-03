import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'


export const getTeams = async (req: Request, res: Response): Promise<void> => {
    try {
        let rows = []
        if (req.query.filter != undefined) {
            if (req.query.skip != undefined) {
                if (req.query.take != undefined) {

                    const params = z.object({
                        take: z.number(),
                        skip: z.number(),
                        filter: z.string()
                    }).safeParse({
                        take: Number(req.query.take),
                        skip: Number(req.query.skip),
                        filter: req.query.filter
                    })
                    if (!params.success) {
                        res.status(400).send(params);
                        return;
                    };
                    rows = await prismaClient.$queryRaw`SELECT * FROM "Team" WHERE CAST("number" AS TEXT) LIKE ${params.data.filter + '%'} OR name ILIKE ${params.data.filter  + '%'}  LIMIT ${params.data.take} OFFSET ${params.data.skip}`;

        

                }
                else {

                    const params = z.object({
                        skip: z.number(),
                        filter: z.string()
                    }).safeParse({
                        skip: Number(req.query.skip),
                        filter: req.query.filter
                    })
                    if (!params.success) {
                        res.status(400).send(params);
                        return;
                    };
                    rows =                     rows =  await prismaClient.$queryRaw`SELECT * FROM "Team" WHERE CAST("number" AS TEXT) LIKE ${params.data.filter + '%'} OR name ILIKE ${params.data.filter + '%'}`;

                }
            }
            else {
                if (req.query.take != undefined) {

                    const params = z.object({
                        take: z.number(),
                        filter: z.string()
                    }).safeParse({
                        take: Number(req.query.take),
                        filter: req.query.filter
                    })
                    if (!params.success) {
                        res.status(400).send(params);
                        return;
                    };
                    rows =  await prismaClient.$queryRaw`SELECT * FROM "Team" WHERE CAST("number" AS TEXT) LIKE ${params.data.filter + '%'}  OR name ILIKE ${params.data.filter + '%'} LIMIT ${params.data.take}`;


                }
                else {
                    const params = z.object({
                        filter: z.string()
                    }).safeParse({
                        filter: req.query.filter
                    })
                    if (!params.success) {
                        res.status(400).send(params);
                        return;
                    };
                    rows =  await prismaClient.$queryRaw`SELECT * FROM "Team" WHERE CAST("number" AS TEXT) LIKE ${params.data.filter + '%'} OR name ILIKE ${params.data.filter + '%'}`;

                }
            }
        }
        else {
            if (req.query.take != undefined) {
                if (req.query.skip != undefined) {
                    const params = z.object({
                        skip: z.number(),
                        take: z.number()
                    }).safeParse({
                        skip: Number(req.query.skip),
                        take: Number(req.query.take)
                    })
                    if (!params.success) {
                        res.status(400).send(params);
                        return;
                    };
                    rows = await prismaClient.team.findMany({
                        take: params.data.take,
                        skip: params.data.skip

                    })
                }
                else {
                    const params = z.object({
                        take: z.number()
                    }).safeParse({
                        take: Number(req.query.take)
                    })
                    if (!params.success) {
                        res.status(400).send(params);
                        return;
                    };

                    rows = await prismaClient.team.findMany({
                        take: params.data.take,
                    })
                }

            }
            else {
                if (req.query.skip != undefined) {
                    const params = z.object({
                        skip: z.number()
                    }).safeParse({
                        skip: Number(req.query.skip)
                    })
                    if (!params.success) {
                        res.status(400).send(params);
                        return;
                    };
                    rows = await prismaClient.team.findMany({
                        skip: params.data.skip
                    })
                }
                else {
                    rows = await prismaClient.team.findMany({})

                }
            }
        }
        let count = 0
        if(req.query.filter != undefined)
        {
            let tempRows : Array<any> = await prismaClient.$queryRaw`SELECT * FROM "Team" WHERE CAST("number" AS TEXT) LIKE ${req.query.filter + '%'} OR name ILIKE ${req.query.filter + '%'}`;
            count = tempRows.length
        }
        else
        {
            count = (await prismaClient.team.findMany({})).length
        }
        res.status(200).send({teams : rows, count : count})
    }
    catch(error)
    {
        console.error(error)
        res.status(400).send(error)
    }
    
};