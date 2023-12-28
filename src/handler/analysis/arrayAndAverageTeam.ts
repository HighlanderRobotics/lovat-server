import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";
import { singleMatchEventsAverage } from "./singleMatchEventsAverage";
import { time } from "console";


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
        matchKeys.forEach(async element => {
            const currData = await singleMatchEventsAverage(req, metric.includes("point") ||  metric.includes("points"), element.key, team, metric)
            if(currData !== null)
            {
                timeLineArray.push( {match : element.key, dataPoint : currData})
            }
        });
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