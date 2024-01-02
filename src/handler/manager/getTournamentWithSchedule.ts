import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";


export const getTournamentsWithSchedule = async (req: Request, res: Response): Promise<void> => {
    try {
        const params = z.object({
            uuid: z.string()
        }).safeParse({
            uuid: req.params.uuid
        })
        if (!params.success) {
            res.status(400).send(params);
            return;
        };
        const scouter = await prismaClient.scouter.findUnique({
            where : {
                uuid : params.data.uuid
            }
        })
        const rows = await prismaClient.scouterScheduleShift.groupBy({
           by : ["tournamentKey"],
           where : 
           {
                sourceTeamNumber : scouter.sourceTeamNumber
           },
        })
        const tournamentKeys = rows.map(row => row.tournamentKey);
        const tournamentInfo = await prismaClient.tournament.findMany({
            where :
            {
                key : {
                    in : tournamentKeys
                }             
            }
        })
        res.status(200).send(tournamentInfo);
    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};