import { Request, Response } from "express";
import prismaClient from '../../prismaClient'


export const deleteScouterShift = async (req: Request, res: Response): Promise<void> => {
    try {
        let userID = "change later"
        if (Array.isArray(req.headers.uuid) || !req.headers.uuid) {
            res.status(400).send("Invalid UUID");
            return;
        }
        let uuid = req.headers.uuid
           const rows = await prismaClient.scouterScheduleShift.delete({
            where: {
                sourceTeam : {
                    email : userID
                },
                uuid : uuid
            }
        })
        res.status(200).send('deleted scouter shift');
    }
    catch(error)
    {
        console.error(error)
        res.status(400).send(error)
    }
    
};