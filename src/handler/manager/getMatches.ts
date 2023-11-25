import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z, { number } from 'zod'
 import { AuthenticatedRequest } from "../../requireAuth";


export const getMatches = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const MatchesFilterSchema = z.object({
            tournamentKey: z.string(),
            teamNumber: z.array(z.number()),
        })
        const currMatchesFilter = {
            tournamentKey: req.params.tournament,
            // teamNumber: req.query.teams
        }
        const possibleTypeError = MatchesFilterSchema.safeParse(currMatchesFilter)
        if (!possibleTypeError.success) {
            res.status(400).send(possibleTypeError)
            return
        }
        const rows = await prismaClient.teamMatchData.findMany({
            where: {
                tournamentKey : req.params.tournament,
                // teamNumber : {
                //     in : teams
                // }
            }

        })
        if(!rows)
        {
            res.status(404).send("Tournament or matches not found")
        }

        res.status(200).send(rows);
    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};