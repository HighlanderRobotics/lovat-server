import { Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";


export const teamTournamentStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const params = z.object({
           team : z.string()
        }).parse(req.query)

        res.status(200).send({"rank" : 3, "rps" : 20, "tournament_rank" : "9/12"});
    }
    catch (error) {
        console.error(error)
        res.status(500).send(error)
    }

};