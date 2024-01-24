import { Request, Response } from "express";
import prismaClient from '../../../prismaClient'
import z, { date } from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { singleMatchEventsAverage } from "./singleMatchEventsAverage";
import { autoEnd, matchTimeEnd, multiplerBaseAnalysis, teleopStart } from "../analysisConstants";
import { run } from "node:test";


export const arrayAndAverageTeam = async (req: AuthenticatedRequest, metric: string, team: number): Promise<{ average: number, timeLine: Array<{ match: string, dataPoint: number }> }> => {
    try {
        const params = z.object({
            team: z.number(),
        }).safeParse({
            team: team,
        })
        if (!params.success) {
            throw (params)
        };
        let matchKeys = await prismaClient.teamMatchData.findMany({
            where: {
                tournamentKey:
                {
                    in: req.user.tournamentSource
                },
                teamNumber: team
            },
            orderBy:
                [
                    {
                        tournament: {
                            date: "asc"
                        }
                    },
                    //aplhabetical with QUALIFICATION first, then ELIMINATION

                    { matchType: "asc" },
                    { matchNumber: "asc" },

                ]
        })

        type Match = {
            key: string;
            tournamentKey: string;
            matchNumber: number;
            teamNumber: number;
            matchType: string;
        };

        const groupedByTournament = matchKeys.reduce<Record<string, Match[]>>((acc, match) => {
            acc[match.tournamentKey] = acc[match.tournamentKey] || [];
            acc[match.tournamentKey].push(match);
            return acc;
        }, {});
        const tournamentGroups: Match[][] = Object.values(groupedByTournament);

        const timeLineArray = []
        const tournamentAverages = []
        //group into tournaments, calculate all averages indivudally so they can all be properly weighted after the nested loops
        for (const tournament of tournamentGroups) {
            let currAvg = null
            for (const match of tournament) {
                let currData = null
                //add time constraints if nessissary
            
                if (metric.includes("teleop") || metric.includes("Teleop")) {
                    currData = await singleMatchEventsAverage(req, metric.includes("point") || metric.includes("Point"), match.key, team, metric, teleopStart, matchTimeEnd)
                }
                else if (metric.includes("auto") || metric.includes("Auto")) {
                    currData = await singleMatchEventsAverage(req, metric.includes("point") || metric.includes("Point"), match.key, team, metric, 0, autoEnd)
                }
                else {
                    currData = await singleMatchEventsAverage(req, metric.includes("point") || metric.includes("Point"), match.key, team, metric)
                }
                if (currData) {
                    timeLineArray.push({ match: match.key, dataPoint: currData })
                    if(!currAvg)
                    {
                        currAvg = currData
                    }
                    else
                    {
                        currAvg = (currAvg + currData)/2
                    }
                }
            }  
            if(currAvg)
            {
                tournamentAverages.push(currAvg)
            }          
        };

        let runningAverage = 0
        for(let i = 0; i < tournamentAverages.length; i ++)
        {   
            if(i === 0)
            {
                runningAverage = tournamentAverages[i]
            }
            else if(i === tournamentAverages.length -1)
            {
                const recentTournament = matchKeys[matchKeys.length-1].tournamentKey
                const scoutedMatchesAtMostRecentTournament =  timeLineArray.filter(item => item.match.startsWith(recentTournament)).length;
                const totalMatchesAtMostRecentTournament = tournamentGroups[i].length
                //0.95 because thats were it asymmpotes, not where it will realsitically reach. Graph on desmos to see more info
                const weightOnRecent = 0.95*(1 - (1 / ((multiplerBaseAnalysis * scoutedMatchesAtMostRecentTournament / totalMatchesAtMostRecentTournament) + 1)))
                runningAverage = runningAverage * (1-weightOnRecent) + tournamentAverages[i] * weightOnRecent
            }
            else
            {
                runningAverage = runningAverage * 0.2 + tournamentAverages[i] * 0.8
            }
        }


        return {
            average: runningAverage,
            timeLine: timeLineArray
        }

    }
    catch (error) {
        console.error(error)
        throw (error)
    }

};