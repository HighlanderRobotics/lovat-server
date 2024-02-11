import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";


export const updatePicklist = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = req.user
        const params = z.object({
            name: z.string(),
            totalPoints: z.number(),
            defense: z.number(),
            pickUps :z.number() ,
            stage : z.number(),
            highNote : z.number(),
            autoPoints : z.number(),
            driverAbility :z.number() ,
            speakerScores : z.number(),
            ampScores : z.number(),
            teleopPoints : z.number(),
            trapScores :z.number(),                   
            authorId: z.string()
        }).safeParse({
            name: req.body.name,
            totalPoints: req.body.totalPoints || 0,
            defense: req.body.defense || 0,
            pickUps : req.body.pickUps || 0,
            stage : req.body.stage || 0,
            highNote : req.body.highNote || 0,
            autoPoints : req.body.autoPoints || 0,
            driverAbility : req.body.driverAbility || 0,
            speakerScores : req.body.speakerScores || 0,
            ampScores : req.body.ampScores || 0,
            teleopPoints : req.body.teleopPoints || 0,
            trapScores : req.body.trapScores || 0,           
            authorId : user.id

        })
        if (!params.success) {
            res.status(400).send(params);
            return;
        };
        const row = await prismaClient.sharedPicklist.update({
            where : 
            {
                uuid : req.params.uuid,
                author : {
                    teamNumber : user.teamNumber
                }
            },
            data: {
                name : params.data.name,
                totalPoints: params.data.totalPoints,
                defense: params.data.defense,
                pickUps : params.data.pickUps,
                stage : params.data.stage,
                autoPoints : params.data.autoPoints,
                driverAbility : params.data.driverAbility,
                speakerScores : params.data.speakerScores,
                ampScores : params.data.ampScores,
                teleopPoints : params.data.teleopPoints,
                trapScores : params.data.trapScores,
                authorId : params.data.authorId
            }
        })
        if(!row)
        {
            res.status(403).send("Not authorized to update this picklist")
            return
        }
        res.status(200).send("picklist updated");
    }
    catch (error) {
        console.error(error)
        res.status(500).send(error)
    }

};