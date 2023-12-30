import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";


export const updateNotes = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = req.user
        const params = z.object({
           note : z.string(),
           uuid : z.string()
        }).safeParse({
           note : z.string(),
           uuid : req.params.uuid
        })
        if (!params.success) {
            res.status(400).send(params);
            return;
        };
        const userRow = await prismaClient.user.findUnique({
            where : 
            {
                id : req.user.id
            }
        })
        if(userRow.role !== "SCOUTING_LEAD")
        {
            res.status(401).send("Not authorized to edit this note")
            return
        }
        const row = await prismaClient.scoutReport.update({
            where : 
            {
                uuid : req.params.uuid,
                scouter :
                {
                    sourceTeamNumber : req.user.teamNumber
                }
              
            },
            data :
            {
                notes : params.data.note
            }
        })
        if(!row)
        {
            res.status(401).send("Not authorized to update this picklist")
            return
        }
        res.status(200).send("Note updated");
    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};