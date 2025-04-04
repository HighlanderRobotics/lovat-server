import { Response } from "express";
import prismaClient from '../../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { singleMatchSingleScoutReport } from "../coreAnalysis/singleMatchSingleScoutReport";
import { Metric, FlippedRoleMap, specificMatchPageMetrics, metricToName } from "../analysisConstants";
import { BargeResultReverseMap} from "../../manager/managerConstants"

import { autoPathScouter } from "./autoPathScouter";


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
        const data = {
            totalPoints: await singleMatchSingleScoutReport(req.user, true, scoutReport.uuid, Metric.totalPoints),
            driverAbility: scoutReport.driverAbility,
            role : FlippedRoleMap[scoutReport.robotRole],
            // stage : stageMap[scoutReport.stage],
            // highNote : highNoteMap[scoutReport.highNote],
            barge : BargeResultReverseMap[scoutReport.bargeResult],
            autoPath : await autoPathScouter(req.user, scoutReport.teamMatchKey, scoutReport.uuid),
            note : scoutReport.notes,
            timeStamp : scoutReport.startTime
        }
        for (const element of specificMatchPageMetrics) {
            data[metricToName[element]] = await singleMatchSingleScoutReport(req.user, false, scoutReport.uuid, element)
        };

        res.status(200).send(data)


    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};