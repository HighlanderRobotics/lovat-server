import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
 import { AuthenticatedRequest } from "../../requireAuth";


export const addPicklist = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const PicklistSchema = z.object({
            name : z.string(),
            avgTotal : z.number(),
            authorId : z.string()
        }) 
        const user = req.user
         
     
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
        const rows = await prismaClient.sharedPicklist.create({
            data: currPicklist
        })
        res.status(200).send("picklist added");
    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};