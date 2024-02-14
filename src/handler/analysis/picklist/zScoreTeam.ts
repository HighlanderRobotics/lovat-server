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
        let zScores = []
        for (const element of picklistSliders) {
            const currData = arrayAndAverageTeam(req, element, teamNumber)
            zScores.push(currData)

        

        };
        await Promise.all(zScores).then((values) => {
            for (const currTeamData of values) {
                let hasData = true
                let isFirst = true
                for (let i = 0; i < values.length; i++) {
                    let currData = values[i]
                    let element = picklistSliders[i]
                    let zScore = (currData.average - allTeamAvgSTD[element].allAvg) / allTeamAvgSTD[element].arraySTD
                    if (isFirst && currData.timeLine !== null && currData.timeLine.length === 0) {
                        hasData = false
                    }
                    else {
                        adj.push({ "result": 0, "type": element })
                        unAdj.push({ "result": 0, "type": element })
                    }
                    isFirst = false
                    if (isNaN(zScore)) {
                        zScore = 0
                    }
                    adj.push({ "result": zScore * params.data[picklistSliderMap[element]], "type": element })
                    unAdj.push({ "result": zScore, "type": element })
                }
            }

        })
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