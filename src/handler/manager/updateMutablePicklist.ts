import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../requireAuth";
 
export const updateMutablePicklist = async (req: AuthenticatedRequest, res: Response): Promise<void> => {

    try {
        const user = req.user
        const MutablePicklistSchema = z.object({
            name : z.string(),
            teams : z.array(z.number().min(0)),
            authorId : z.string()
        }) 

        const currMutablePicklist = {
            name: req.body.name,
            teams: req.body.teams,
            authorId : user.id
        }
        const possibleTypeError = MutablePicklistSchema.safeParse(currMutablePicklist)
        if(!possibleTypeError.success)
        {
            res.status(400).send(possibleTypeError)
            return
        }

           const row = await prismaClient.mutablePicklist.update({
            where : {
                uuid : req.params.uuid,
                author : {
                    teamNumber : user.teamNumber
                }
            },
            data: currMutablePicklist
        });
        if(!row)
        {
            res.status(401).send("Not authorized to update this picklist")
            return
        }

        res.status(200).send("mutable picklist updated");
    } catch(error) {
        console.error(error);
        res.status(400).send(error);
    }

};
