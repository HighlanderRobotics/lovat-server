import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";
import { nonEventMetric } from "./nonEventMetric";


export const breakdownMetrics = async (req: AuthenticatedRequest, res : Response) => {
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
        const metrics = ["robotRole"]
        let result = {}
        metrics.forEach(async element => {
            result[element] = await nonEventMetric(req, params.data.team, element )
        });
        res.status(200).send(metrics)
    }
    catch (error) {
       res.status(400).send(error)
    }

};