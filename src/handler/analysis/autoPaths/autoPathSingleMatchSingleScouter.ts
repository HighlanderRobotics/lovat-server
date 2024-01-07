import { Request, Response } from "express";
import prismaClient from '../../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { nonEventMetric } from "../coreAnalysis/nonEventMetric";
import { autoEnd, exludedAutoEvents } from "../analysisConstants";


export const autoPathSingleMatchSingleScouter = async (req: AuthenticatedRequest, matchKey : string, scouterUuid : string) => {
    try {
        const params = z.object({
           matchKey : z.string(),
           scouterUuid : z.string()
        }).safeParse({
           matchKey : matchKey,
           scouterUuid : scouterUuid
        })
        if (!params.success) {
            throw(params)
        };
        const autoData = await prismaClient.event.findMany({
            where : 
            {
                scoutReport :
                {
                    teamMatchKey : params.data.matchKey,
                    scouterUuid : params.data.scouterUuid
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
            location: event.position,
            event: event.action,
            time: event.time
        }))

        return  {
            autoPoints : totalScore,
            positions : positions,
            match : params.data.matchKey

        }
        
    
    }
    catch (error) {
        console.log(error)
      throw(error)
    }

};