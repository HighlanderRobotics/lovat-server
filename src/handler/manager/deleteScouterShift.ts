import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { getUser } from "./getUser";
import { AuthenticatedRequest } from "../../requireAuth";


export const deleteScouterShift = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const DeleteScouterShiftSchema = z.object({
            uuid : z.string()
        }) 
        const deleteScouterShift = 
        {
            uuid : req.params.uuid
        }
        const possibleTypeErrorUser =  DeleteScouterShiftSchema.safeParse(deleteScouterShift)
        if (!possibleTypeErrorUser.success) {
            res.status(400).send(possibleTypeErrorUser)
            return
        }
        const user = await getUser(req, res)
        if(user === null)
        {
            return
        }
           const rows = await prismaClient.scouterScheduleShift.deleteMany({
            where: {
                AND: [
                    {sourceTeamNumber : user.teamNumber}, 
                    {uuid: deleteScouterShift.uuid }]
                
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