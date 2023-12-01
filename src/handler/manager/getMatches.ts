// import { Request, Response } from "express";
// import prismaClient from '../../prismaClient'
// import z, { number } from 'zod'
// import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";
// import { addTournamentMatches } from "./addTournamentMatches";
// import prisma from "../../prismaClient";


// export const getMatches = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
//     try {
//         const user = req.user
//         let tournamentKey = req.params.tournament
//         const matchRows = await prismaClient.teamMatchData.findMany({
//             where:
//             {
//                 tournamentKey: tournamentKey
//             }
//         })
//         if (matchRows.length === 0) {
//             await addTournamentMatches(tournamentKey)
//         }
//         const MatchesFilterSchema = z.object({
//             tournamentKey: z.string(),
//             teamNumbers: z.array(z.number()),
//             isScouted: z.boolean().nullable()
//         })
//         const currMatchesFilter = {
//             tournamentKey: tournamentKey,
//             teamNumbers: req.query.teams,
//             isScouted: req.query.isScouted
//         }
//         const possibleTypeError = MatchesFilterSchema.safeParse(currMatchesFilter)
//         if (!possibleTypeError.success) {
//             res.status(400).send(possibleTypeError)
//             return
//         }
//         const userSourceData = user.teamSource
//         let finalMatches = []
//         if (currMatchesFilter.isScouted == null) {
//             finalMatches = await prismaClient.teamMatchData.findMany({
//                 where:
//                 {
//                     tournamentKey: currMatchesFilter.tournamentKey
//                 }
//             })
//             if (!finalMatches) {
//                 res.status(404).send("matches not found")
//             }
//         }
//         else if (currMatchesFilter.isScouted) {
//             finalMatches = await prismaClient.teamMatchData.findMany({
//                 where:
//                 {

//                 }
//             })
//         }
//         else {
//             finalMatches = await prismaClient.teamMatchData.groupBy({
                
//             })
//         }
//         if (currMatchesFilter.teamNumbers.length > 0) {

//         }



//         res.status(200).send(finalMatches);
//     }
//     catch (error) {
//         console.error(error)
//         res.status(400).send(error)
//     }

// };