import { Request, Response } from "express";
import prismaClient from '../../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { driverAbility, highNoteMap, matchTimeEnd, metricToEvent, stageMap } from "../analysisConstants";
import { autoPathSingleMatchSingleScoutReport } from "../autoPaths/autoPathSingleMatchSingleScoutReport";
import { singleMatchSingleScoutReport } from "../coreAnalysis/singleMatchSingleScoutReport";
import { cooperationSingleMatch } from "../coreAnalysis/cooperationSingleMatch";
// import { cooperationSingleMatch } from "./cooperationSingleMatch";


export const totalPointsScoutingLead = async (scoutReportUuid : string): Promise<number> => {
    try {
       const points = await prismaClient.event.aggregate({
        where :
        {
            scoutReportUuid : scoutReportUuid
        },
        _sum :
        {
            points : true
        }
       })
       const totalPoints = points._sum.points || 0; 
       //only doing events bc "strikes" will be calculated sepratly
       return totalPoints
    }
    catch (error) {
        console.error(error)
        throw (error)
    }

};