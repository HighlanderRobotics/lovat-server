import { Request, Response } from "express";
import prismaClient from '../../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { singleMatchEventsAverage } from "../coreAnalysis/singleMatchEventsAverage";
import { arrayAndAverageTeam } from "../coreAnalysis/arrayAndAverageTeam";
import { specificMatchPageMetrics } from "../analysisConstants";
import { singleMatchSingleScouter } from "../coreAnalysis/singleMatchSingleScouter";
import { match } from "assert";
import { autoPathSingleMatchSingleScouter } from "../autoPaths/autoPathSingleMatchSingleScouter";


export const matchPageSpecificScouter = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const params = z.object({
            matchKey: z.string(),
            scouterUuid: z.string()
        }).safeParse({
            matchKey: req.params.match,
            scouterUuid: req.params.scouterUuid
        })
        if (!params.success) {
            res.status(400).send(params)
            return
        };
        //comfirm if finding first is ideal
        const scoutReport = await prismaClient.scoutReport.findFirst({
            where:
            {
                teamMatchKey: params.data.matchKey,
                scouterUuid: params.data.scouterUuid
            }
        })
        let data = {
            totalPoints: await singleMatchSingleScouter(req, true, params.data.matchKey, "totalpoints", params.data.scouterUuid),
            driverAbility: scoutReport.driverAbility,
            role : scoutReport.robotRole,
            autoPath : await autoPathSingleMatchSingleScouter(req, params.data.matchKey, params.data.scouterUuid)
        }
        for (const element of specificMatchPageMetrics) {
            data[element] = await singleMatchSingleScouter(req, false, params.data.matchKey, "totalpoints", params.data.scouterUuid)
        };

        res.status(200).send(data)


    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};