import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { getUser } from "./getUser";
import { AuthenticatedRequest } from "../../requireAuth";


export const deleteMutablePicklist = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        
        const user = await getUser(req, res); 
        const MutablePicklistSchema = z.object({
            uuid: z.string()
        })
        const currMutablePicklist = 
        {
            uuid : req.params.uuid
        }


        const possibleTypeErrorMutablePicklist = MutablePicklistSchema.safeParse(currMutablePicklist)
        if (!possibleTypeErrorMutablePicklist.success) {
            res.status(400).send(possibleTypeErrorMutablePicklist)
            return
        }
        const picklist = await prismaClient.mutablePicklist.findUnique({
            where: currMutablePicklist,
            include : {
                author : true
            }
            
        });
        if (!user || !picklist) {
            res.status(404).send("User or picklist not found");
            return;
        }
        if (user.teamNumber === picklist.author.teamNumber) {
            await prismaClient.mutablePicklist.delete({
                where: currMutablePicklist
            });
            res.status(200).send("Picklist deleted successfully");
        } else {
            res.status(403).send("Unauthorized to delete this picklist");
        }
    } catch (error) {
        console.error(error);
        res.status(400).send("Error in deleting picklist");
    }
};
