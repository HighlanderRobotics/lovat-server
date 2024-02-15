import { Request, Response } from "express";
import prismaClient from '../../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { arrayAndAverageTeam } from "../coreAnalysis/arrayAndAverageTeam";
import { arrayAndAverageAllTeam } from "../coreAnalysis/arrayAndAverageAllTeams";
import { picklistSliderMap, picklistSliders } from "../analysisConstants";


export const zScoreTeam = async (req: AuthenticatedRequest, allTeamAvgSTD: Object, teamNumber: number, params, allTeamData: Object): Promise<{ zScore: number, adjusted: Array<Object>, unadjusted: Array<Object> }> => {
    try {
        let adj = []
        let unAdj = []
        let zScores = []

        for (const metric of picklistSliders) {
            let hasData = true
            let isFirst = true
            let currData = allTeamData[metric][teamNumber]
            if (!currData) {
                hasData = false
            }
            isFirst = false

            if (!hasData) {
                unAdj.push({ "result": 0, "type": metric })
            }
            else {
                let zScore = (currData.average - allTeamAvgSTD[metric].allAvg) / allTeamAvgSTD[metric].arraySTD
           
                if (isNaN(zScore)) {
                    zScore = 0
                }
                adj.push({ "result": zScore * params.data[picklistSliderMap[metric]], "type": metric })
                unAdj.push({ "result": zScore, "type": metric })
            }

        }



        let zScore = await adj.reduce((partialSum, a) => partialSum + a.result, 0)
        return {
            "zScore": zScore,
            "adjusted": adj,
            "unadjusted": unAdj
        }
    }
    catch (error) {
        console.log(error)
        throw (error)
    }

};