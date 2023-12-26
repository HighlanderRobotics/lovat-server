import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";
import { singleMatchEventsAverage } from "./singleMatchEventsAverage";
import { time } from "console";


export const arrayAndAverage = async (req: AuthenticatedRequest, metric : string, team : number): Promise<Object> => {
    try {
        const params = z.object({
            team : z.number()
         }).safeParse({
             team : team
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
        matchKeys.forEach(element => {
            timeLineArray.push( {match : element.key, dataPoint : singleMatchEventsAverage(req, metric.includes("point") ||  metric.includes("points"), element.key, team, metric)})
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