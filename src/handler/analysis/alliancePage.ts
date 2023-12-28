import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";
import { singleMatchEventsAverage } from "./singleMatchEventsAverage";
import { arrayAndAverageTeam } from "./arrayAndAverageTeam";


export const alliancePage = async (req : AuthenticatedRequest, team1 : number, team2 : number, team3 : number) => {
    try {
       
        let teamOnePoints = await arrayAndAverageTeam(req, "totalPoints", team1)
        let teamTwoPoints = await arrayAndAverageTeam(req, "totalPoints", team2)
        let teamThreePoints = await arrayAndAverageTeam(req, "totalPoints", team3)

        //constants: total points, and auto paths
        return {
            totalPoints : teamOnePoints.average + teamTwoPoints.average + teamThreePoints.average
        }

    }
    catch (error) {
        console.log(error)
        throw (error)
    }

};