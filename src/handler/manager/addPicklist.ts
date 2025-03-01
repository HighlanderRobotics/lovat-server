import { Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";


export const addPicklist = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const params = z.object({
            name: z.string(),
            totalPoints: z.number(),
            defense : z.number(),
            autoPoints : z.number(),
            driverAbility : z.number(),
            teleopPoints : z.number(),
            authorId: z.string(),
            feeds : z.number(),
            coralPickups :z.number() ,
            algaePickups: z.number(),
            barge : z.number(),
            coralLevel1Scores: z.number(),
            coralLevel2Scores: z.number(),
            coralLevel3Scores: z.number(),
            coralLevel4Scores: z.number(),
            algaeProcessor: z.number(),
            algaeNet: z.number()
        }).safeParse({
            name: req.body.name,
            totalPoints: req.query.totalpoints || 0,
            autoPoints: req.query.autopoints || 0,
            teleopPoints: req.query.teleoppoints || 0,
            driverAbility: req.query.driverability || 0,
            barge: req.query.bargeresult || 0,
            coralLevel1Scores: req.query.level1 || 0,
            coralLevel2Scores: req.query.level2 || 0,
            coralLevel3Scores: req.query.level3 || 0,
            coralLevel4Scores: req.query.level4 || 0,
            coralPickups: req.query.coralpickup || 0,
            algaeProcessor: req.query.algaeProcessor || 0,
            algaeNet: req.query.algaeNet || 0,
            algaePickups: req.query.algaePickups || 0,
            feeds: req.query.feeds || 0,
            defense: req.query.defends || 0,
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
        await prismaClient.sharedPicklist.create({
            data: {
                name : params.data.name,
                totalPoints : params.data.totalPoints,
                defense : params.data.defense,
                autoPoints : params.data.autoPoints,
                driverAbility : params.data.driverAbility,
                teleopPoints : params.data.teleopPoints,
                feeds : params.data.feeds,
                algaePickups : params.data.algaePickups,
                coralPickups : params.data.coralPickups,
                barge : params.data.barge,
                coralLevel1Scores : params.data.coralLevel1Scores,
                coralLevel2Scores : params.data.coralLevel2Scores,
                coralLevel3Scores : params.data.coralLevel3Scores,
                coralLevel4Scores : params.data.coralLevel4Scores,
                algaeNet : params.data.algaeNet,
                algaeProcessor : params.data.algaeProcessor,
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