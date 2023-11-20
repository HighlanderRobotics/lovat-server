import { Request, Response } from "express";
import prismaClient from '../../prismaClient'


export const deletePicklist = async (req: Request, res: Response): Promise<void> => {
    try {
        if (Array.isArray(req.headers.uuid) || !req.headers.uuid) {
            res.status(400).send("Invalid UUID");
            return;
        }
        const uuid = req.headers.uuid as string; 
        const userEmail = "place holder"; 

        const picklist = await prismaClient.sharedPicklist.findUnique({
            where: { uuid: uuid },
            include: { sourceTeam: true } 
        });

        if (picklist && picklist.sourceTeam.email === userEmail) {
            await prismaClient.mutablePicklist.delete({
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
