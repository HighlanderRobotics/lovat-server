import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";


export const deleteUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const checkScoutingLead = await prismaClient.user.findMany({
            where :
            {
                teamNumber : req.user.teamNumber,
                role : "SCOUTING_LEAD"
            }
        })
        if(checkScoutingLead === null || checkScoutingLead.length === 0) 
        {
            res.status(404).send("Cannot find any scouting leads for the given team")
            return
        }
        else if(req.user.role === "SCOUTING_LEAD" && checkScoutingLead.length === 1)
        {
            res.send(400).send("Cannot delete the only scouting lead for the given team")
            return
        }
        else
        {
            const deleteUser = await prismaClient.user.delete({
                where : 
                {
                    id : req.user.id
                }
            })
            res.status(200).send("User deleted")
            
        }
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
};
