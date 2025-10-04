// import { Request, Response } from "express";
// import prismaClient from '../../prismaClient'
// import z from 'zod'
// import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";

// export const scoutingLead = async (req: AuthenticatedRequest, res : Response) => {
//     try {
//         if(req.user.role !== "SCOUTING_LEAD")
//         {
//             res.status(401).send("Not authorized to delete this picklist")
//         }
//         const flaggedMatches = await prismaClient.flaggedScoutReport.findMany({
//             where :
//             {
//                 scoutReport :
//                 {
//                     scouter :
//                     {
//                         sourceTeamNumber : req.user.teamNumber
//                     }
//                 }
//             },
//             select :
//             {
//                 note : true,
//                 scoutReportUuid : true,
//                 scoutReport :
//                 {
//                     select :
//                     {
//                         scouter : {
//                             select :
//                             {
//                                 name : true
//                             }
//                         }
//                     }
//                 }
//             }

//         })
//         const scouters = await prismaClient.scouter.findMany({
//             where :
//             {
//                 sourceTeamNumber : req.user.teamNumber
//             },
//             select :
//             {
//                 name : true,
//                 strikes : true
//             }
//         })
//         res.status(200).send({flaggedMatches : flaggedMatches, scouters : scouters})

//     }
//     catch (error) {
//        res.status(400).send(error)
//     }

// };
