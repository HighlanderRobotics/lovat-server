import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";


export const getAnalysts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if(req.user.teamNumber === null)
        {
            res.status(404).send("Not affilated with a team")
            return
        }
        if(req.user.role !== "SCOUTING_LEAD")
        {
            res.status(404).send("Not a scouting lead")
            return
        }
        const analystsOnTeam = await prismaClient.user.findMany({
            where : 
            {
                teamNumber : req.user.teamNumber,
                role : "ANALYST"
            }
        })
        res.status(200).send(analystsOnTeam)
    } catch (error) {
        console.error(error);
        res.status(400).send(error);
    }
};
