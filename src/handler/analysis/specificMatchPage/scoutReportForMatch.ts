import { Request, Response } from "express";
import prismaClient from '../../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { singleMatchEventsAverage } from "../coreAnalysis/singleMatchEventsAverage";
import { arrayAndAverageTeam } from "../coreAnalysis/arrayAndAverageTeam";
import { specificMatchPageMetrics } from "../analysisConstants";
import { singleMatchSingleScoutReport } from "../coreAnalysis/singleMatchSingleScoutReport";
import { match } from "assert";
import { autoPathSingleMatchSingleScoutReport } from "../autoPaths/autoPathSingleMatchSingleScoutReport";


export const scoutReportForMatch = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const params = z.object({
            matchKey: z.string(),
        }).safeParse({
            matchKey: req.params.match,
        })
        if (!params.success) {
            res.status(400).send(params)
            return
        };
        //comfirm if finding first is ideal
        if (req.user.teamNumber === null || req.user.role !== "SCOUTING_LEAD") {
            res.status(403).send("Not authorized to acsess this endpoint.")
            return
        }
        const scoutReports = await prismaClient.scoutReport.findMany({
            where:
            {
                teamMatchKey: params.data.matchKey,
                scouter:
                {
                    sourceTeamNumber: req.user.teamNumber
                }
            },

            select:
            {
                uuid: true,
                scouterUuid: true,
                notes : true,
                startTime : true,
                scouter:
                {
                    select:
                    {
                        name: true
                    }
                }


            }
        })

        
        res.status(200).send(scoutReports)


    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};