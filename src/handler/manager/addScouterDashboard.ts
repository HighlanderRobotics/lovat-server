import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";


export const addScouterDashboard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const params = z.object({
          name : z.string()
        }).safeParse({
            name: req.body.name,
        })
        if (!params.success) {
            res.status(400).send(params);
            return;
        };
        if(req.user.role === "SCOUTING_LEAD" || req.user.teamNumber !== 0)
        {
            res.status(403).send("Not authorized to make a scouter")
            return
        }
        const scouter = await prismaClient.scouter.create({
            data :
            {
                name : params.data.name,
                sourceTeamNumber : req.user.teamNumber
            }
        })
        res.status(200).send("Scouter added");
    }
    catch (error) {
        console.error(error)
        res.status(500).send(error)
    }

};