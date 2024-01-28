import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
  import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";


export const deleteScouterShift = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
       
        const params = z.object({
            uuid: z.string()
        }).safeParse({
            uuid: req.params.uuid
        })

        if (!params.success) {
            res.status(400).send(params);
            return;
        };
        const user = req.user
        const scouterShift = await prismaClient.scouterScheduleShift.findUnique({
            where: {
                uuid : params.data.uuid
            },
        });

        if(!scouterShift)
        {
            res.status(404).send("scouter shift not found")
            return
        }

        if ( user.teamNumber === scouterShift.sourceTeamNumber) {
            await prismaClient.scouterScheduleShift.delete({
                where: {
                    uuid : params.data.uuid
                }
            });
            res.status(200).send("scouter shift deleted successfully");
            
        } else {
            res.status(401).send("Unauthorized to delete this picklist");
        }
    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};