import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";


export const checkCodeScouter = async (req: Request, res: Response): Promise<void> => {
    try {

        const params = z.object({
            code: z.string()
        }).safeParse({
            code: req.query.code
        })
        if (!params.success) {
            res.status(400).send(params);
            return;
        };

        const teamWithCode = await prismaClient.registeredTeam.findUnique({
            where:
            {
                code: params.data.code
            }
        })
        if(teamWithCode === null)
        {
            //not a valid code
            res.status(200).send(false)
        }
        else
        {
            const newScouter = await prismaClient.scouter.create({
                data : 
                {
                    sourceTeamNumber : teamWithCode.number,
                }
            })
            res.status(200).send(newScouter)
        }

    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};


