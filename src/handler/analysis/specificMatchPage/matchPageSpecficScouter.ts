import { Request, Response } from "express";
import prismaClient from '../../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { singleMatchEventsAverage } from "../coreAnalysis/singleMatchEventsAverage";
import { arrayAndAverageTeam } from "../coreAnalysis/arrayAndAverageTeam";
import { highNoteMap, roleMap, specificMatchPageMetrics, stageMap } from "../analysisConstants";
import { singleMatchSingleScoutReport } from "../coreAnalysis/singleMatchSingleScoutReport";
import { match } from "assert";
import { autoPathSingleMatchSingleScoutReport } from "../autoPaths/autoPathSingleMatchSingleScoutReport";


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
            totalPoints: await singleMatchSingleScoutReport(req, true, scoutReport.uuid, "totalpoints"),
            driverAbility: scoutReport.driverAbility,
            role : roleMap[scoutReport.robotRole],
            stage : stageMap[scoutReport.stage],
            highNote : highNoteMap[scoutReport.highNote],
            autoPath : await autoPathSingleMatchSingleScoutReport(req, scoutReport.teamMatchKey, scoutReport.uuid),
            note : scoutReport.notes,
            timeStamp : scoutReport.startTime
        }
        for (const element of specificMatchPageMetrics) {
            data[element] = await singleMatchSingleScoutReport(req, false, scoutReport.uuid, element)
        };

        res.status(200).send(data)


    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};