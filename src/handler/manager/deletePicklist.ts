import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";


export const deletePicklist = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {

        const user = req.user
     

        const params = z.object({
            uuid: z.string(),
        }).safeParse({
            uuid: req.params.uuid,
        })

        if (!params.success) {
            res.status(400).send(params);
            return;
        };

        const picklist = await prismaClient.sharedPicklist.findUnique({
            where: {uuid :  params.data.uuid},
            include: { author: true }
        });
        if (!picklist) {
            res.status(404).send("Picklist not found")
            return
        }

        if (user.teamNumber === picklist.author.teamNumber) {
            await prismaClient.sharedPicklist.delete({
                where: {uuid : params.data.uuid}
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
