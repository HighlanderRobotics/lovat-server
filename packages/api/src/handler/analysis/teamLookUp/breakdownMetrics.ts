import { Response } from "express";
import z from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { nonEventMetric } from "../coreAnalysis/nonEventMetric";
import { metricsBreakdown } from "../analysisConstants";


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
        const result = {}
        for (const element of metricsBreakdown) {
            result[element] = await nonEventMetric(req.user, params.data.team, element )
        };
        res.status(200).send(result)
    }
    catch (error) {
       res.status(400).send(error)
    }

};