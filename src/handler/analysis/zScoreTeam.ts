import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";
import { arrayAndAverageTeam } from "./arrayAndAverageTeam";
import { arrayAndAverageAllTeam } from "./arrayAndAverageAllTeams";


export const zScoreTeam = async (req: AuthenticatedRequest, allTeamAvgSTD: Object) : Promise<{zScore : number, adjusted : Array<Object>, unadjusted : Array<Object>}>=> {
    try {
        let adj = []
        let unAdj = []
        const picklistSliders = ["metrics", "go", "here"]
        picklistSliders.forEach(async element => {
            const currData = await arrayAndAverageAllTeam(req, element)
            let zScore = (currData.average - allTeamAvgSTD[element].allAvg) / allTeamAvgSTD[element].arraySTD
            if (isNaN(zScore)) { zScore = 0 }
            adj.push({ "result": zScore * req.body[element], "type": element })
            unAdj.push({ "result": zScore, "type": element })
        });
        let zScore = adj.reduce((partialSum, a) => partialSum + a.result, 0)
        return {
            "zScore": zScore,
            "adjusted" : adj,
            "unadjusted" : unAdj
        }
    }
    catch (error) {
        console.log(error)
        throw(error)
    }

};