import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
 import { AuthenticatedRequest } from "../../requireAuth";


export const deleteScouterShift = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const DeleteScouterShiftSchema = z.object({
            uuid: z.string()
        })
        const currScouterShift =
        {
            uuid: req.params.uuid
        }
        const possibleTypeErrorUser = DeleteScouterShiftSchema.safeParse(currScouterShift)
        if (!possibleTypeErrorUser.success) {
            res.status(400).send(possibleTypeErrorUser)
            return
        }
        const user = req.user
        const scouterShift = await prismaClient.scouterScheduleShift.findUnique({
            where: currScouterShift,
        });

        if(!scouterShift)
        {
            res.status(404).send("scouter shift not found")
            return
        }

        if ( user.teamNumber === scouterShift.sourceTeamNumber) {
            await prismaClient.scouterScheduleShift.delete({
                where: currScouterShift
            });
            res.status(200).send("scouter shift deleted successfully");
        } else {
            res.status(401).send("Unauthorized to delete this picklist");
        }
        res.status(200).send('deleted scouter shift');
    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};