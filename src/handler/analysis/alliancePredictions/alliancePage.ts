import { Request, Response } from "express";
import prismaClient from '../../../prismaClient'
import z, { number } from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { singleMatchEventsAverage } from "../coreAnalysis/singleMatchEventsAverage";
import { arrayAndAverageTeam } from "../coreAnalysis/arrayAndAverageTeam";
import { robotRole } from "../coreAnalysis/robotRole";


export const alliancePage = async (req : AuthenticatedRequest, team1 : number, team2 : number, team3 : number): Promise<{totalPoints : number, teams : Array<Object>}> =>{
    try {
        let teamOnePoints = await arrayAndAverageTeam(req, "totalPoints", team1)
        let teamTwoPoints = await arrayAndAverageTeam(req, "totalPoints", team2)
        let teamThreePoints = await arrayAndAverageTeam(req, "totalPoints", team3)

        let teamOneMainRole = (await robotRole(req, team1)).mainRole
        let teamTwoMainRole = (await robotRole(req, team2)).mainRole
        let teamThreeMainRole = (await robotRole(req, team3)).mainRole


        //constants: total points, teams {team, role, autoPaths, averagePoints}
        return {
            totalPoints : teamOnePoints.average + teamTwoPoints.average + teamThreePoints.average,
            teams :[{ team : team1, role : teamOneMainRole, averagePoints : teamOnePoints.average},
                {team : team2, role : teamTwoMainRole, averagePoints : teamTwoPoints.average},
                {team : team3, role : teamThreeMainRole, averagePoints : teamThreePoints.average}
            ]
        }

    }
    catch (error) {
        console.log(error)
        throw (error)
    }

};