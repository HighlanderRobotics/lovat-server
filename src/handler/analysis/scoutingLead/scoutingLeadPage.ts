// import { Request, Response } from "express";
// import prismaClient from '@/src/prismaClient.js'
// import z from 'zod'
// import { AuthenticatedRequest } from "@/src/lib/middleware/requireAuth.js";
// import { driverAbility, highNoteMap, matchTimeEnd, metricToEvent, stageMap } from "@/src/handler/analysis/analysisConstants.js";
// import { autoPathSingleMatchSingleScoutReport } from "@/src/handler/analysis/autoPaths/autoPathSingleMatchSingleScoutReport";
// import { singleMatchSingleScoutReport } from "@/src/handler/analysis/coreAnalysis/singleMatchSingleScoutReport";
// import { cooperationSingleMatch } from "@/src/handler/analysis/coreAnalysis/cooperationSingleMatch";
// // import { cooperationSingleMatch } from "@/src/handler/analysis/scoutingLead/cooperationSingleMatch";

// export const scoutingLeadPage = async (req : AuthenticatedRequest, res : Response) => {
//     try {
//         if(req.user.role === "SCOUTING_LEAD")
//         {
//             res.status(401).send("Not authorized to acsess this page")
//             return
//         }
//         else
//         {
//             const flaggedMatches = await prismaClient.flaggedScoutReport.findMany({
//                 where :
//                 {
//                     scoutReport :
//                     {
//                         scouter :
//                         {
//                             sourceTeamNumber : req.user.teamNumber
//                         }
//                     }
//                 },
//                 select :
//                 {
//                     note : true,
//                     scoutReport :
//                     {
//                        select :
//                        {
//                             teamMatchData :
//                             {
//                                 select :
//                                 {
//                                     teamNumber : true,
//                                     tournamentKey : true,
//                                     matchType : true,
//                                     matchNumber : true
//                                 }
//                             },
//                             scouter :
//                             {
//                                 select :
//                                 {
//                                     name : true
//                                 }
//                             }
//                         }
//                     }
//                 }
//             })
//             res.status(200).send({flaggedMatches : flaggedMatches})
//         }
//     }
//     catch (error) {
//         console.error(error)
//         res.status(400).send(error)
//     }

// };
