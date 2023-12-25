import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";
import { singleMatchEventsAverage } from "./singleMatchEventsAverage";
import { arrayAndAverage } from "./arrayAndAverage";


export const categoryMetrics = async (req: AuthenticatedRequest, metric: string, team : number): Promise<Object> => {
    try {
       const metricNameArray = ["teleopPoints", "autoPoints", "totalPoints", "driverAbility", "defense"]
       let result = {}
       metricNameArray.forEach(async element => {
            result[element] = await arrayAndAverage(req, element, team)
       });
        return {metricNameArray}
    }
    catch (error) {
        console.error(error)
        throw (error)
    }

};