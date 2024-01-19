import { Request, Response } from "express";
import prismaClient from '../../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { arrayAndAverageTeam } from "../coreAnalysis/arrayAndAverageTeam";
import { metricsCategory } from "../analysisConstants";


export const categoryMetrics = async (req: AuthenticatedRequest, res: Response) => {
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
        let result = {}
         //update if statments in arrayAndAverage if the metric needs to look at scoutReport instead of events table
         for (const element of metricsCategory) {
            result[element] = (await arrayAndAverageTeam(req, element, params.data.team)).average;
        }
       
        res.status(200).send(result)
    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};