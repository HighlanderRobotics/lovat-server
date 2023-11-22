// import { Request, Response } from "express";
// import prismaClient from '../../prismaClient'
// import z from 'zod'



// export const filterMatches = async (req: Request, res: Response): Promise<void> => {
//     try {
//         let teams = req.query.teams
//         let sourceTeamSetting = req.query.sourceTeamSetting

//         const rows = prismaClient.scoutReport.findMany(
//             {
//                 where : 
//                 {
//                     scouter :
//                     {
//                         sourceTeamNumber : teams
//                     }
//                 }
//             }
           
//         )
//     }
//     catch(error)
//     {
//         console.error(error)
//         res.status(400).send(error)
//     }
    
// };