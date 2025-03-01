import { Response } from "express";
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
            coralPickups :z.number() ,
            algaePickups: z.number(),
            barge : z.number(),
            coralLevel1Scores: z.number(),
            coralLevel2Scores: z.number(),
            coralLevel3Scores: z.number(),
            coralLevel4Scores: z.number(),
            algaeProcessor: z.number(),
            algaeNet: z.number(),
            autoPoints : z.number(),
            driverAbility :z.number() ,
            teleopPoints : z.number(),
            authorId: z.string()
        }).safeParse({
            name: req.body.name,
            totalPoints: req.body.totalpoints || 0,
            autoPoints: req.body.autopoints || 0,
            teleopPoints: req.body.teleoppoints || 0,
            driverAbility: req.body.driverability || 0,
            barge: req.body.bargeresult || 0,
            coralLevel1Scores: req.body.level1 || 0,
            coralLevel2Scores: req.body.level2 || 0,
            coralLevel3Scores: req.body.level3 || 0,
            coralLevel4Scores: req.body.level4 || 0,
            coralPickups: req.body.coralpickup || 0,
            algaeProcessor: req.body.algaeProcessor || 0,
            algaeNet: req.body.algaeNet || 0,
            algaePickups: req.body.algaePickups || 0,
            feeds: req.body.feeds || 0,
            defense: req.body.defends || 0,
            authorId: user.id
        })

        console.log({ addPicklistQuery: req.query, addPicklistBody: req.body });

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
                algaePickups : params.data.algaePickups,
                coralPickups : params.data.coralPickups,
                barge : params.data.barge,
                autoPoints : params.data.autoPoints,
                driverAbility : params.data.driverAbility,
                coralLevel1Scores : params.data.coralLevel1Scores,
                coralLevel2Scores : params.data.coralLevel2Scores,
                coralLevel3Scores : params.data.coralLevel3Scores,
                coralLevel4Scores : params.data.coralLevel4Scores,
                algaeNet : params.data.algaeNet,
                teleopPoints : params.data.teleopPoints,
                algaeProcessor : params.data.algaeProcessor,
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