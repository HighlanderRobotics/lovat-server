import { Request, Response } from "express";
import prismaClient from '../../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { arrayAndAverageTeam } from "../coreAnalysis/arrayAndAverageTeam";
import { arrayAndAverageAllTeam } from "../coreAnalysis/arrayAndAverageAllTeams";
import { picklistSliderMap, picklistSliders } from "../analysisConstants";
import { flag } from "../flag";


export const zScoreTeam = async (req: AuthenticatedRequest, allTeamAvgSTD: Object, teamNumber: number, params, metricTeamAverages: Object, flags: Array<string>): Promise<{ zScore: number, adjusted: Array<Object>, unadjusted: Array<Object>, flags : Array<Object> }> => {
    try {
        let adj = []
        let unAdj = []
        let zScores = []
        let flagData = []
        for (const metric of picklistSliders) {
            let hasData = true
            let isFirst = true
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