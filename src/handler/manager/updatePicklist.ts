import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { getUser } from "./getUser";
import { AuthenticatedRequest } from "../../requireAuth";


export const updatePicklist = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const PicklistSchema = z.object({
            name : z.string(),
            avgTotal : z.number(),
            authorId : z.string()
        }) 
        const user = await getUser(req, res)
        if(user === null)
        {
            return
        }
        const currPicklist = {
            name: req.body.name,
            avgTotal: req.body.avgTotal,
            authorId: user.id
        }
        const possibleTypeError = PicklistSchema.safeParse(currPicklist)
        if(!possibleTypeError.success)
        {
            res.status(400).send(possibleTypeError)
            return
        }
        const row = await prismaClient.sharedPicklist.update({
            where : 
            {
                uuid : req.params.uuid,
                author : {
                    teamNumber : user.teamNumber
                }
            },
            data: currPicklist
        })
        if(!row)
        {
            res.status(401).send("Not authorized to update this picklist")
            return
        }
        res.status(200).send("picklist updated");
    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};