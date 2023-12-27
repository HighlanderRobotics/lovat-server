// import { Request, Response } from "express";
// import prismaClient from '../../prismaClient'
// import z from 'zod'
// import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";
// import { arrayAndAverageTeam } from "./arrayAndAverageTeam";


// export const matchPrediction = async (req: AuthenticatedRequest, res: Response) => {
//     try {
//         const params = z.object({
//             team : z.number()
//          }).safeParse({
//              team : req.params.team
//          })
//          if (!params.success) {
//              res.status(400).send(params);
//              return;
//          };
       
       
//         res.status(200).send(result)
//     }
//     catch (error) {
//         console.error(error)
//         res.status(400).send(error)
//     }

// };