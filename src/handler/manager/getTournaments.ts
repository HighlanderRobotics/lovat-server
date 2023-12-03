import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z, { ZodNumber } from 'zod'
import { unwatchFile } from "fs";


export const getTournaments = async (req: Request, res: Response): Promise<void> => {
    try {

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
                    if (!params.success) {
                        res.status(400).send(params);
                        return;
                    };
                    const rows = await prismaClient.tournament.findMany({
                        take: params.data.take,
                        skip: params.data.skip,
                        where:
                        {
                            OR: [{ key: { contains: params.data.filter } },
                            { name: { contains: params.data.filter } }]
                        }


                    })
                    res.status(200).send(rows);

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
                    if (!params.success) {
                        res.status(400).send(params);
                        return;
                    };
                    const rows = await prismaClient.tournament.findMany({
                        skip: params.data.skip,
                        where:
                        {
                            OR: [{ key: { contains: params.data.filter } },
                            { name: { contains: params.data.filter } }]
                        }


                    })
                    res.status(200).send(rows);
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
                    const rows = await prismaClient.tournament.findMany({
                        take: params.data.take,
                        where:
                        {
                            OR: [{ key: { contains: params.data.filter } },
                            { name: { contains: params.data.filter } }]
                        }


                    })
                    res.status(200).send(rows);

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
                    const rows = await prismaClient.tournament.findMany({
                        where:
                        {
                            OR: [{ key: { contains: params.data.filter } },
                            { name: { contains: params.data.filter } }]
                        }


                    })
                    res.status(200).send(rows);
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
                    const rows = await prismaClient.tournament.findMany({
                        take: params.data.take,
                        skip: params.data.skip

                    })
                    res.status(200).send(rows);
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

                    const rows = await prismaClient.tournament.findMany({
                        take: params.data.take,
                    })
                    res.status(200).send(rows);
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
                    const rows = await prismaClient.tournament.findMany({
                        skip: params.data.skip
                    })
                    res.status(200).send(rows);
                }
                else {
                    const rows = await prismaClient.tournament.findMany({})
                    res.status(200).send(rows);

                }
            }
        }
    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};