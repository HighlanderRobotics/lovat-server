import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";
import { singleMatchEventsAverage } from "./singleMatchEventsAverage";
import { arrayAndAverage } from "./arrayAndAverage";


export const categoryMetrics = async (req: AuthenticatedRequest, res: Response): Promise<Object> => {
    try {
        const params = z.object({
            team : z.number()
         }).safeParse({
             team : req.params.team
         })
         if (!params.success) {
             res.status(400).send(params);
             return;
         };
        const eventMetricArray = ["teleopPoints", "autoPoints", "totalPoints", "defense"]
        const nonEventMetricArray = ["driverAbility"]
        let result = {}
        eventMetricArray.forEach(async element => {
            result[element] = await arrayAndAverage(req, element, params.data.team)
        })
        nonEventMetricArray.forEach(async element => {
            //update if statments in arrayAndAverage if the metric needs to look at scoutReport instead of events table
            result[element] = await arrayAndAverage(req, element, params.data.team)
        })
        return result
    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};