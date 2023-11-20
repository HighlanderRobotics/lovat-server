import { Request, Response } from "express";
import prismaClient from '../../prismaClient'


export const deleteScoutReport = async (req: Request, res: Response): Promise<void> => {
    try {
        if (Array.isArray(req.headers.uuid) || !req.headers.uuid) {
            res.status(400).send("Invalid UUID");
            return;
        }
        const uuid = req.headers.uuid as string; 
        const userEmail = "place holder"; 

        const deletingUser = await prismaClient.users.findUnique({
            where: 
            {
                email : userEmail
            } 
        });
        const scouter = await prismaClient.scoutReport.findUnique({
            where: 
            {
                uuid : uuid
            },
            include : {
                scouter : true
            }
            
        });


        if (scouter.teamNumber === deletingUser.teamNumber && deletingUser.role === "SCOUTING_LEAD" ) {
            await prismaClient.mutablePicklist.delete({
                where: { uuid: uuid }
            });
            res.status(200).send("Data deleted successfully");
        } else {
            res.status(403).send("Unauthorized to delete this picklist");
        }
    } catch (error) {
        console.error(error);
        res.status(400).send("Error in deleting data");
    }
};
