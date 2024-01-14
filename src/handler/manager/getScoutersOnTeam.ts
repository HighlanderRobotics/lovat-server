import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";


export const getScoutersOnTeam = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log(req.headers)
        const params = z.object({
            teamCode : z.string()
        }).safeParse({
            teamCode : req.headers['x-team-code']
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
            res.status(400).send("Team code does not exist")
            return
        }
        const rows = await prismaClient.scouter.findMany({
            where: {
                sourceTeamNumber : teamRow.number
            }
        })
        res.status(200).send(rows);
    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};