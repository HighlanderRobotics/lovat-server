import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { getUser } from "./getUser";
import { AuthenticatedRequest } from "../../requireAuth";


export const getScouterSchedule = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = await getUser(req, res)
        const TournamentSchema = z.object({
            tournamentKey : z.string()
        })
        const currTournament = { tournamentKey : req.params.tournament}
        const possibleTypeError = TournamentSchema.safeParse(currTournament)
        if (!possibleTypeError.success) {
            res.status(400).send(possibleTypeError)
            return
        }
        if(user === null)
        {
            return
        }
        const rows = await prismaClient.scouterScheduleShift.findMany({
            where: {
                AND :([{ sourceTeamNumber : user.teamNumber}, currTournament])
               
            }
        })
        res.status(200).send(rows);
    }
    catch(error)
    {
        console.error(error)
        res.status(400).send(error)
    }
    
};