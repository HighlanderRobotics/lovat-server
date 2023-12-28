import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";
import { singleMatchEventsAverage } from "./singleMatchEventsAverage";
import { arrayAndAverageTeam } from "./arrayAndAverageTeam";
import { alliancePage } from "./alliancePage";


export const alliancePageResponse = async (req: AuthenticatedRequest, res : Response) => {
    try {
       
        const params = z.object({
            team1 : z.number(),
            team2 : z.number(),
            team3 : z.number()
        }).safeParse({
            team1 : req.query.teamOne,
            team2 : req.query.teamTwo,
            team3 : req.query.teamThree
        })
        if (!params.success) {
            res.status(400).send(params);
            return;
        };
        const alliancePageData = await alliancePage(req, params.data.team1, params.data.team2, params.data.team3)
        
        res.status(200).send(alliancePageData)
    }
    catch (error) {
       res.status(400).send(error)
        throw (error)
    }

};