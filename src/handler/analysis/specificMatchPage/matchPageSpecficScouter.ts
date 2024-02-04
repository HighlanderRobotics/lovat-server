import { Request, Response } from "express";
import prismaClient from '../../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { singleMatchEventsAverage } from "../coreAnalysis/singleMatchEventsAverage";
import { arrayAndAverageTeam } from "../coreAnalysis/arrayAndAverageTeam";
import { roleMap, specificMatchPageMetrics } from "../analysisConstants";
import { singleMatchSingleScouter } from "../coreAnalysis/singleMatchSingleScouter";
import { match } from "assert";
import { autoPathSingleMatchSingleScouter } from "../autoPaths/autoPathSingleMatchSingleScouter";


export const matchPageSpecificScouter = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const params = z.object({
            scoutReportUuid : z.string()
        }).safeParse({
            scoutReportUuid : req.params.uuid
        })
        if (!params.success) {
            res.status(400).send(params)
            return
        };
        const scoutReport = await prismaClient.scoutReport.findUnique({
            where:
            {
                uuid : params.data.scoutReportUuid
            }
        })
        let data = {
            totalPoints: await singleMatchSingleScouter(req, true, scoutReport.teamMatchKey, "totalpoints", scoutReport.scouterUuid),
            driverAbility: scoutReport.driverAbility,
            role : roleMap[scoutReport.robotRole],
            autoPath : await autoPathSingleMatchSingleScouter(req, scoutReport.teamMatchKey, scoutReport.scouterUuid)
        }
        for (const element of specificMatchPageMetrics) {
            data[element] = await singleMatchSingleScouter(req, false, scoutReport.teamMatchKey, element, scoutReport.scouterUuid)
        };

        res.status(200).send(data)


    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};