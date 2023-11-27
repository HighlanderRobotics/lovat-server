import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";


export const deletePicklist = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {

        const uuid = req.params.uuid;
        const user = req.user
        const DeletePicklistSchema = z.object({
            uuid: z.string()
        })
        const currPicklist = { uuid: uuid }
        const possibleTypeError = DeletePicklistSchema.safeParse(currPicklist)
        if (!possibleTypeError.success) {
            res.status(400).send(possibleTypeError)
            return
        }

        const picklist = await prismaClient.sharedPicklist.findUnique({
            where: currPicklist,
            include: { author: true }
        });
        if (!picklist) {
            res.status(404).send("Picklist not found")
            return
        }

        if (user.teamNumber === picklist.author.teamNumber) {
            await prismaClient.sharedPicklist.delete({
                where: currPicklist
            });
            res.status(200).send("Picklist deleted successfully");
        } else {
            res.status(401).send("Unauthorized to delete this picklist");
        }
    } catch (error) {
        console.error(error);
        res.status(400).send(error);
    }
};
