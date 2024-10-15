import prismaClient from '../../../prismaClient'
import { matchTimeEnd } from "../analysisConstants";
import { singleMatchSingleScoutReport } from "./singleMatchSingleScoutReport";
import { cooperationSingleMatch } from "./cooperationSingleMatch";
import { User } from "@prisma/client";
// import { cooperationSingleMatch } from "./cooperationSingleMatch";


export const singleMatchEventsAverage = async (user: User,  isPointAverage: boolean, matchKey: string, team: number, metric1 : string, timeMin = 0, timeMax : number = matchTimeEnd): Promise<number> => {
    try {
        const scoutReports = await prismaClient.scoutReport.findMany({
            where :
            {
                teamMatchKey : matchKey,
                teamMatchData :
                {
                    tournamentKey : {
                        in : user.tournamentSource
                    },
                    teamNumber : team
                },
                scouter :
                {
                    sourceTeamNumber : 
                    {
                        in :user.teamSource
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
            const matchDataArray = []

            for(const element of scoutReports)
            {
                let data = null
                if(metric1 === "cooperation")
                {
                    data = await cooperationSingleMatch(user, matchKey, team)
                }
                else
                {
                    data = await singleMatchSingleScoutReport(user, isPointAverage, element.uuid, metric1,  timeMin, timeMax)
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