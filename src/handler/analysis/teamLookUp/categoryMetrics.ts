import { Response } from "express";
import z from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { metricsCategory } from "../analysisConstants";
import { arrayAndAverageTeamFast } from "../coreAnalysis/arrayAndAverageTeamFast";


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
        const result = {}
         //update if statments in arrayAndAverage if the metric needs to look at scoutReport instead of events table
         for (const element of metricsCategory) {
            result[element] = (await arrayAndAverageTeamFast(req.user, element, params.data.team)).average;
        }
       
        res.status(200).send(result)
    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};