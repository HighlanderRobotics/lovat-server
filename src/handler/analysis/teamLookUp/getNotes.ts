import { Request, Response } from "express";
import prismaClient from '../../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { arrayAndAverageTeam } from "../coreAnalysis/arrayAndAverageTeam";
import { arrayAndAverageAllTeam } from "../coreAnalysis/arrayAndAverageAllTeams";


export const getNotes = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const params = z.object({
            team: z.number(),
        }).safeParse({
            team: Number(req.params.team),
        })
        if (!params.success) {
            res.status(400).send(params);
            return;
        };
        const notes = await prismaClient.scoutReport.findMany({
            where : 
            {
                teamMatchData :
                {
                    teamNumber : params.data.team
                },
                scouter : 
                {
                    sourceTeamNumber : {
                        in : req.user.teamSource
                    }
                }

            }
        })
        res.status(200).send(notes)
    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};