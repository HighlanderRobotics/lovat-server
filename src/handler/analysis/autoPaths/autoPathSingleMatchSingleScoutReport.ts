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
                action :
                {
                    notIn : exludedAutoEvents
                }
            
            },
           
           

        })
        let scoutReport = await prismaClient.scoutReport.findUnique({
            where :
            {
                uuid : scoutReportUuid
            }
        })
        let match = await prismaClient.teamMatchData.findUnique({
            where :
            {
                key : scoutReport.teamMatchKey
            },
            include :
            {
                tournament : true
            }
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
            tournamentName : match.tournament.name
        }
        
    
    }
    catch (error) {
        console.log(error)
      throw(error)
    }

};