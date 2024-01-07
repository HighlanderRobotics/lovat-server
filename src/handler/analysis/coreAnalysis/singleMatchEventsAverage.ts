import { Request, Response } from "express";
import prismaClient from '../../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { driverAbility, highNoteMap, matchTimeEnd, metricToEvent, stageMap, trapMap } from "../analysisConstants";
import { autoPathSingleMatchSingleScouter } from "../autoPaths/autoPathSingleMatchSingleScouter";
import { singleMatchSingleScouter } from "./singleMatchSingleScouter";


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
            return 0
        }
        else
        {
            let matchDataArray = []
            for(const element of scoutReports)
            {
                const currData = await singleMatchSingleScouter(req, isPointAverage, matchKey, metric1, element.scouterUuid, timeMin, timeMax)
                if(currData !== null && currData !== 0)
                {
                    matchDataArray.push(currData)
                }
            }
          return matchDataArray.reduce((acc, val) => acc + val, 0) / matchDataArray.length;

        }
    }
    catch (error) {
        console.error(error)
        throw (error)
    }

};