import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { getUser } from "./getUser";


export const deletePicklist = async (req: Request, res: Response): Promise<void> => {
    try {
       
        const uuid = req.params.uuid; 
        const user = await getUser(req, res)
        const DeletePicklistSchema = z.object({
            uuid : z.string()
        }) 
        const deletePicklist = {uuid : uuid}
        const possibleTypeErrorUser =  DeletePicklistSchema.safeParse(deletePicklist)
        if (!possibleTypeErrorUser.success) {
            res.status(400).send(possibleTypeErrorUser)
            return
        }

        const picklist = await prismaClient.sharedPicklist.findUnique({
            where: deletePicklist,
            include: { author: true } 
        });
        if(!picklist)
        {
            res.status(404).send("Picklist not found")
            return
        }

        if ( user.teamNumber === picklist.author.teamNumber) {
            await prismaClient.sharedPicklist.delete({
                where: { uuid: uuid }
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
