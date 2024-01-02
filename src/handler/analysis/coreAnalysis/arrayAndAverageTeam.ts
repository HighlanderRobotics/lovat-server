import { Request, Response } from "express";
import prismaClient from '../../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { singleMatchEventsAverage } from "./singleMatchEventsAverage";
import { autoEnd, matchTimeEnd, teleopStart } from "../analysisConstants";


export const arrayAndAverageTeam = async (req: AuthenticatedRequest, metric : string, team : number): Promise<{average : number, timeLine : Array<{match : string, dataPoint : number}>}> => {
    try {
        const params = z.object({
            team : z.number(),
         }).safeParse({
             team : team,
         })
         if (!params.success) {
             throw(params)
         };
        const matchKeys = await prismaClient.teamMatchData.findMany({
            where : {
                tournamentKey : 
                {
                    in : req.user.tournamentSource
                },
                teamNumber : team
            },
            orderBy :
            {
                tournament :
                {
                    date : "asc"
                },
                //aplhabetical with QUALIFICATION first, then ELIMINATION
                matchType : "desc",
                matchNumber : "asc"
            }
        })
        const timeLineArray = []
        for (const element of matchKeys) {
            let currData = null
            //add time constraints if nessissary
            if(metric.includes("teleop") || metric.includes("Teleop"))
            {
                currData = await singleMatchEventsAverage(req, metric.includes("point") ||  metric.includes("Point"), element.key, team, metric, teleopStart, matchTimeEnd)
            }
            else if(metric.includes("auto") || metric.includes("Auto"))
            {
                currData = await singleMatchEventsAverage(req, metric.includes("point") ||  metric.includes("Point"), element.key, team, metric, 0, autoEnd)
            }
            else
            {
                currData = await singleMatchEventsAverage(req, metric.includes("point") ||  metric.includes("Point"), element.key, team, metric)
            }
            if(currData !== null)
            {
                timeLineArray.push( {match : element.key, dataPoint : currData})
            }
        };
        const average = timeLineArray.reduce((acc, cur) => acc + cur.dataPoint, 0) / timeLineArray.length;
        return {
            average : average,
            timeLine : timeLineArray
        }

    }
    catch (error) {
        console.error(error)
        throw (error)
    }

};