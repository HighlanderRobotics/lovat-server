import { Request, Response } from "express";
import prismaClient from '../../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { arrayAndAverageTeam } from "../coreAnalysis/arrayAndAverageTeam";
import { arrayAndAverageAllTeam } from "../coreAnalysis/arrayAndAverageAllTeams";
import { picklistSliderMap, picklistSliders } from "../analysisConstants";
import { flag } from ".././teamLookUp/flag";
import { rankFlag } from "../rankFlag";


export const zScoreTeam = async (req: AuthenticatedRequest, allTeamAvgSTD: Object, teamNumber: number, params, metricTeamAverages: Object, flags: Array<string>): Promise<{ zScore: number, adjusted: Array<Object>, unadjusted: Array<Object>, flags : Array<Object> }> => {
    try {
        let adj = []
        let unAdj = []
        let zScores = []
        let flagData = []
        for (const metric of picklistSliders) {
            let hasData = true
            let isFirst = true
            //total points is 0 then they (probably) have no data
            //averages out over time, by the end of a tournament they will have scored
            let currData = metricTeamAverages[metric][teamNumber]
            if (!currData) {
                hasData = false
            }
            isFirst = false
            let zScore = 0
            if (hasData) {
                zScore = (currData.average - allTeamAvgSTD[metric].allAvg) / allTeamAvgSTD[metric].arraySTD
            }
            else {
                currData = 0
                zScore = 0
            }

            if (isNaN(zScore)) {
                zScore = 0
            }
            adj.push({ "result": zScore * params.data[picklistSliderMap[metric]], "type": metric })
            unAdj.push({ "result": zScore, "type": metric })
            if (flags.includes(metric)) {
                if (!hasData) {
                    flagData.push({ type: metric, result: 0 })
                }
                else {
                    flagData.push({ type: metric, result: currData.average })
                }
            }
        }
        if(flags.includes("rank") && req.query.tournamentKey)
        {
            if(req.query.tournamentKey)
            {
                flagData.push({ type: "rank", result: await rankFlag(req, "frc" + teamNumber, req.query.tournamentKey as string) })
            }
            else
            {
                let tourament = await prismaClient.tournament.findFirst({
                    where :
                    {
                        teamMatchData :
                        {
                            some :
                            {
                                teamNumber : params.data.team
                            }
                        }
                    },
                    orderBy :
                    {
                        date : "desc"
                    }
                })
                flagData.push({ type: "rank", result: await rankFlag(req, "frc" + teamNumber, tourament.key) })

            }
        }



        let zScore = await adj.reduce((partialSum, a) => partialSum + a.result, 0)
        return {
            "zScore": zScore,
            "adjusted": adj,
            "unadjusted": unAdj,
            "flags": flagData
        }
    }
    catch (error) {
        console.log(error)
        throw (error)
    }

};

