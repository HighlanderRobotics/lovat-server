// import { Request, Response } from "express";
// import prismaClient from '@/src/prismaClient.js'
// import z from 'zod'
// import { AuthenticatedRequest } from "@/src/lib/middleware/requireAuth.js";
// import { singleMatchEventsAverage } from "@/src/handler/analysis/coreAnalysis/singleMatchEventsAverage";
// import { arrayAndAverageTeam } from "@/src/handler/analysis/coreAnalysis/arrayAndAverageTeam";
// import { specificMatchPageMetrics } from "@/src/handler/analysis/analysisConstants.js";
// import { singleMatchSingleScouter } from "@/src/handler/analysis/coreAnalysis/singleMatchSingleScouter";
// import { match } from "assert";
// import { autoPathSingleMatchSingleScouter } from "@/src/handler/analysis/autoPaths/autoPathSingleMatchSingleScouter";

// export const matchPageAllScouters = async (req: AuthenticatedRequest, res: Response) => {
//     try {
//         const params = z.object({
//             matchKey: z.string(),
//         }).safeParse({
//             matchKey: req.params.match,
//         })
//         if (!params.success) {
//             res.status(400).send(params)
//             return
//         };
//         //comfirm if finding first is ideal
//         const teamPlaying = await prismaClient.teamMatchData.findUnique({
//             where:
//             {
//                 key: params.data.matchKey,
//             }
//         })
//         const scoutReports = await prismaClient.scoutReport.findMany({
//             where :
//             {
//                 teamMatchKey : params.data.matchKey
//             }
//         })
//         let data = {
//             totalPoints: await singleMatchEventsAverage(req, true, params.data.matchKey, teamPlaying.teamNumber, "totalPoints"),
//             driverAbility: await singleMatchEventsAverage(req, true, params.data.matchKey, teamPlaying.teamNumber, "totalPoints"),
//             role : scoutReport.robotRole,
//             autoPath : await autoPathSingleMatchSingleScouter(req, params.data.matchKey, params.data.scouterUuid)
//         }
//         for (const element of specificMatchPageMetrics) {
//             data[element] = await singleMatchEventsAverage(req, false,  params.data.matchKey, teamPlaying.teamNumber, element)
//         };

//         res.status(200).send(data)

//     }
//     catch (error) {
//         console.error(error)
//         res.status(400).send(error)
//     }

// };
