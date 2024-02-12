import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";


export const getTournamentForScouterWithSchedule = async (req: Request, res: Response): Promise<void> => {
    try {
        const params = z.object({
            code: z.string(),
        }).safeParse({
            code: req.headers['x-team-code'],
        })
        if (!params.success) {
            res.status(400).send({ "error": params, "displayError": "Invalid input. Make sure you are using the correct input." });
            return;
        };
        const teamRow = await prismaClient.registeredTeam.findUnique({
            where :
            {
                code : params.data.code
            }
        })
        const tournaments = await prismaClient.tournament.findMany({
            where :
            {
                scouterScheduleShifts :
                {
                    some :
                    {
                        sourceTeamNumber : teamRow.number
                    }
                }
            }
        })
        res.status(200).send(tournaments)
    }
    catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
};
    
