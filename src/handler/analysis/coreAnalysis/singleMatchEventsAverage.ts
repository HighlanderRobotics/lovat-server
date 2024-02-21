import { Request, Response } from "express";
import prismaClient from '../../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { driverAbility, highNoteMap, matchTimeEnd, metricToEvent, stageMap } from "../analysisConstants";
import { autoPathSingleMatchSingleScoutReport } from "../autoPaths/autoPathSingleMatchSingleScoutReport";
import { singleMatchSingleScoutReport } from "./singleMatchSingleScoutReport";
import { cooperationSingleMatch } from "./cooperationSingleMatch";
import { match } from "assert";
// import { cooperationSingleMatch } from "./cooperationSingleMatch";


export const singleMatchEventsAverage = async (req: AuthenticatedRequest,  isPointAverage: boolean, matchKey: string, team: number, metric1 : string, timeMin: number = 0, timeMax : number = matchTimeEnd): Promise<number> => {
    try {
        const scoutReports = await prismaClient.scoutReport.findMany({
            where :
            {
                teamMatchKey : matchKey,
                teamMatchData :
                {
                    tournamentKey : {
                        in : req.user.tournamentSource
                    },
                    teamNumber : team
                },
                scouter :
                {
                    sourceTeamNumber : 
                    {
                        in : req.user.teamSource
                    }
                }
                
            }
        })
        if(scoutReports.length === 0)
        {
            return null
        }
        else
        {
            let matchDataArray = []

            for(const element of scoutReports)
            {
                let data = null
                if(metric1 === "cooperation")
                {
                    data = await cooperationSingleMatch(req, matchKey, team)
                }
                else
                {
                    data = await singleMatchSingleScoutReport(req, isPointAverage, element.uuid, metric1,  timeMin, timeMax)
                }
                if(data !== null)
                {
                    matchDataArray.push(data)
                    
                }
            }
            if(matchDataArray.length !== 0)
            {
                return await matchDataArray.reduce((acc, val) => acc + val, 0) / matchDataArray.length;
            }
            else
            {
                return null
            }

        }
    }
    catch (error) {
        console.error(error)
        throw (error)
    }

};