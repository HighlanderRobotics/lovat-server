import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";


export const deleteScouter = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {

        const user = req.user
        const params = z.object({
            uuid : z.string(),
        }).safeParse({
            uuid : req.body.scouterUuid,
        })
        if (!params.success) {
            res.status(400).send(params);
            return;
        };
        if(user.teamNumber === null)
        { 
            res.status(404).send("The user sending this request is not affilated with a team")
            return

        }
        const scouter = await prismaClient.scouter.findUnique({
            where : 
            {
                uuid : params.data.uuid
            
            }
        })
        if(scouter=== null)
        {
            res.status(404).send("The scouter that you are trying to change the name of does not exist")
            return
        }
        if ( user.role !== "SCOUTING_LEAD" || user.teamNumber !== scouter.sourceTeamNumber) {
            res.status(403).send("Not authorized to update the name of the given scouter")
            return
        }     
        const deletedScouter = await prismaClient.scouter.delete({
            where :
            {
                uuid : params.data.uuid
            }
        })
     
        res.status(200).send("Scouter deleted");

        
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
};
