import { Request, Response } from "express";
import prismaClient from '../../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { singleMatchEventsAverage } from "../coreAnalysis/singleMatchEventsAverage";
import { arrayAndAverageTeam } from "../coreAnalysis/arrayAndAverageTeam";
import { FlippedActionMap, FlippedPositionMap, specificMatchPageMetrics } from "../analysisConstants";
import { singleMatchSingleScoutReport } from "../coreAnalysis/singleMatchSingleScoutReport";
import { match } from "assert";
import { autoPathSingleMatchSingleScoutReport } from "../autoPaths/autoPathSingleMatchSingleScoutReport";


export const timelineForScoutReport = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const params = z.object({
            uuid : z.string()
        }).safeParse({
           uuid : req.params.uuid
        })
        if (!params.success) {
            res.status(400).send(params)
            return
        };
      
       
        const events = await prismaClient.event.findMany({
            where :
            {
                scoutReportUuid : params.data.uuid
            }
        })
        const timelineArray = []
        for(const element of events)
        {
            timelineArray.push([element.time, FlippedActionMap[element.action], FlippedPositionMap[element.position]])
        }

        res.status(200).send(timelineArray)


    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};