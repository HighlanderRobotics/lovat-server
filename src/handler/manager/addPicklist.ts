import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";


export const addPicklist = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const params = z.object({
            name: z.string(),
            totalPoints: z.number(),
            defense : z.number(),
            pickUps : z.number(),
            stage : z.number(),
            autoPoints : z.number(),
            driverAbility : z.number(),
            speakerScores : z.number(),
            ampScores : z.number(),
            teleopPoints : z.number(),
            trapScores : z.number(),
            authorId: z.string(),
            feeds : z.number()
        }).safeParse({
            name: req.body.name,
            totalPoints: req.body.totalPoints || 0,
            defense: req.body.defense || 0,
            pickUps : req.body.pickUps || 0,
            stage : req.body.stage || 0,
            autoPoints : req.body.autoPoints || 0,
            driverAbility : req.body.driverAbility || 0,
            speakerScores : req.body.speakerScores || 0,
            ampScores : req.body.ampScores || 0,
            teleopPoints : req.body.teleopPoints || 0,
            trapScores : req.body.trapScores || 0,
            feeds : req.body.feeds || 0,
            authorId: req.user.id
        })
        if (!params.success) {
            res.status(400).send(params);
            return;
        };
        if(req.user.teamNumber === null)
        {
            res.status(403).send("Not authortized to publish a picklist because your not on a team")
            return
        }
        const rows = await prismaClient.sharedPicklist.create({
            data: {
                name : params.data.name,
                totalPoints : params.data.totalPoints,
                stage : params.data.stage,
                defense : params.data.defense,
                pickUps : params.data.pickUps,
                autoPoints : params.data.autoPoints,
                driverAbility : params.data.driverAbility,
                speakerScores : params.data.speakerScores,
                ampScores : params.data.ampScores,
                teleopPoints : params.data.teleopPoints,
                trapScores : params.data.trapScores,
                feeds : params.data.feeds,
                authorId : params.data.authorId
            }
        })
        res.status(200).send("picklist added");
    }
    catch (error) {
        console.error(error)
        res.status(500).send(error)
    }

};