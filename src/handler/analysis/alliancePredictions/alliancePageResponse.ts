import { Request, Response } from "express";
import prismaClient from '../../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { singleMatchEventsAverage } from "../coreAnalysis/singleMatchEventsAverage";
import { arrayAndAverageTeam } from "../coreAnalysis/arrayAndAverageTeam";
import { alliancePage } from "./alliancePage";


export const alliancePageResponse = async (req: AuthenticatedRequest, res : Response) => {
    try {
       
        const params = z.object({
            team1 : z.number(),
            team2 : z.number(),
            team3 : z.number()
        }).safeParse({
            team1 : Number(req.query.teamOne),
            team2 : Number(req.query.teamTwo),
            team3 : Number(req.query.teamThree)
        })
        if (!params.success) {
            res.status(400).send(params);
            return;
        };
        const alliancePageData = await alliancePage(req.user, params.data.team1, params.data.team2, params.data.team3)
        
        res.status(200).send(alliancePageData)
    }
    catch (error) {
       res.status(400).send(error)
        throw (error)
    }

};