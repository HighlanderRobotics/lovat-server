import { Request, Response } from "express";
import prismaClient from '../../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { nonEventMetric } from "../coreAnalysis/nonEventMetric";
import { FlippedActionMap, FlippedPositionMap, autoEnd, exludedAutoEvents } from "../analysisConstants";
import { PositionMap } from "../../manager/managerConstants";


export const autoPathSingleMatchSingleScoutReport = async (req: AuthenticatedRequest, matchKey : string, scoutReportUuid : string) => {
    try {
        const autoData = await prismaClient.event.findMany({
            where : 
            {
                scoutReport :
                {
                    uuid : scoutReportUuid
                },
                time : 
                {
                    lte : autoEnd
                },
                //ADD OTHER FILTERS ON WHAT EVENT ENUMS COUNT
                action :
                {
                    notIn : exludedAutoEvents
                }
            
            },

        })
        //GET SCOUT REPORT COLUMNN IF NESSISARY
        const totalScore = autoData.reduce((sum, event) => sum + event.points, 0);
        const positions = autoData.map(event => ({
            location: FlippedPositionMap[event.position],
            event: FlippedActionMap[event.action],
            time: event.time
        }))

        return  {
            autoPoints : totalScore,
            positions : positions,
            match : matchKey,
        }
        
    
    }
    catch (error) {
        console.log(error)
      throw(error)
    }

};