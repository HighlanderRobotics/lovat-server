import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";
import { singleMatchEventsAverage } from "./singleMatchEventsAverage";


export const arrayAndAverageAllTeam = async (req: AuthenticatedRequest, metric : string): Promise<{average : number, timeLine : Array<number>}> => {
    try {
       
        const matchKeys = await prismaClient.teamMatchData.findMany({
            where : {
                tournamentKey : 
                {
                    in : req.user.tournamentSource
                },
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
            const currData = singleMatchEventsAverage(req, metric.includes("point") ||  metric.includes("points"), element.key, element.teamNumber, metric)
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