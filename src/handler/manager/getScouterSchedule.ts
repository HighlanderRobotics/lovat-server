import { Request, Response } from "express";
import prismaClient from '../../prismaClient'


export const getScouterSchedule = async (req: Request, res: Response): Promise<void> => {
    try {
        let userID = "change later"
           const rows = await prismaClient.scouterScheduleShift.findMany({
            where: {
                sourceTeam : {
                    email : userID
                }
            },
            // include :
            // {
            //     bind by scouter uuid's
            // }
        })
        res.status(200).send(rows);
    }
    catch(error)
    {
        console.error(error)
        res.status(400).send(error)
    }
    
};