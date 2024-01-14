import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";


export const getScheduleForScouter = async (req: Request, res: Response): Promise<void> => {
    try {
        const params = z.object({
            teamCode: z.string(),
            tournament : z.string()
        }).safeParse({
            teamCode: req.headers['x-team-code'],
            tournament : req.params.tournament
        })
        if (!params.success) {
            res.status(400).send(params);
            return;
        };
        const teamRow = await prismaClient.registeredTeam.findUnique({
            where :
            {
                code : params.data.teamCode
            }
        })
        if(!teamRow)
        {
            res.status(401).send("Uuid does not exist")
            return
        }
        const rows = await prismaClient.scouterScheduleShift.findMany({
            where:
            {
                sourceTeamNumber : teamRow.number,
                tournamentKey : params.data.tournament,
            }

        })
        res.status(200).send(rows);
    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};