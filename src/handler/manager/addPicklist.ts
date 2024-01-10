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
            highNote : z.number(),
            autoPoints : z.number(),
            driveAbility : z.number(),
            speakerScores : z.number(),
            ampScores : z.number(),
            teleopPoints : z.number(),
            trapScores : z.number(),
            authorId: z.string(),
            feeds : z.number()
        }).safeParse({
            name: req.body.name,
            totalPoints: req.body.totalPoints,
            defense: req.body.defense,
            pickUps : req.body.pickUps,
            stage : req.body.stage,
            //only cant do high note rn
            highNote : req.body.highNote,
            autoPoints : req.body.autoPoints,
            driverAbility : req.body.driverAbility,
            speakerScores : req.body.speakerScores,
            ampScores : req.body.ampScores,
            teleopPoints : req.body.teleopPoints,
            trapScores : req.body.trapScores,
            feeds : req.body.feeds,
            authorId: req.user.id
        })
        if (!params.success) {
            res.status(400).send(params);
            return;
        };
   
        const rows = await prismaClient.sharedPicklist.create({
            data: {
                name : params.data.name,
                totalPoints : params.data.totalPoints,
                stage : params.data.stage,
                defense : params.data.defense,
                pickUps : params.data.pickUps,
                highNote : params.data.highNote,
                autoPoints : params.data.autoPoints,
                driverAbility : params.data.driveAbility,
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
        res.status(400).send(error)
    }

};