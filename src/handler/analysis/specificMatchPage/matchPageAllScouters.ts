// import { Request, Response } from "express";
// import prismaClient from '../../../prismaClient'
// import z from 'zod'
// import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
// import { singleMatchEventsAverage } from "../coreAnalysis/singleMatchEventsAverage";
// import { arrayAndAverageTeam } from "../coreAnalysis/arrayAndAverageTeam";
// import { specificMatchPageMetrics } from "../analysisConstants.js";
// import { singleMatchSingleScouter } from "../coreAnalysis/singleMatchSingleScouter";
// import { match } from "assert";
// import { autoPathSingleMatchSingleScouter } from "../autoPaths/autoPathSingleMatchSingleScouter";

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
