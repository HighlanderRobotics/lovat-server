import { Request, Response } from "express";
import prismaClient from '../../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { arrayAndAverageTeam } from "../coreAnalysis/arrayAndAverageTeam";
import { arrayAndAverageAllTeam } from "../coreAnalysis/arrayAndAverageAllTeams";
import { picklistSliderMap, picklistSliders } from "../analysisConstants";


export const zScoreTeam = async (req: AuthenticatedRequest, allTeamAvgSTD: Object, teamNumber: number, params): Promise<{ zScore: number, adjusted: Array<Object>, unadjusted: Array<Object> }> => {
    try {
        let adj = []
        let unAdj = []
        let hasData = true
        let isFirst = true
        for (const element of picklistSliders) {
            if (hasData) {
                const currData = await arrayAndAverageTeam(req, element, teamNumber)
                let zScore = (currData.average - allTeamAvgSTD[element].allAvg) / allTeamAvgSTD[element].arraySTD
              
                if (isFirst && currData.timeLine !== null && currData.timeLine.length === 0) {
                    hasData = false
                }
                isFirst = false
                if (isNaN(zScore)) {
                    zScore = 0
                }
                console.log(element)
                console.log(params.data[picklistSliderMap[element]])
                adj.push({ "result": zScore * params.data[picklistSliderMap[element]], "type": element })
                unAdj.push({ "result": zScore, "type": element })
            }
            else
            {
                //figure out correct # later on
                adj.push({ "result": 0, "type": element })
                unAdj.push({ "result": 0, "type": element })
            }
          
        };
        let zScore = adj.reduce((partialSum, a) => partialSum + a.result, 0)
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