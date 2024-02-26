import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";


export const scoutingLeadProgressPage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if(req.user.teamNumber === null)
        {
            res.status(400).send("Not affilated with a team")
            return
        }
        if(req.user.role !== "SCOUTING_LEAD")
        {
            res.status(400).send("Not a scouting lead")
            return
        }
        //ADD MORE INFO LATER ONCE WE DECIDE WHAT WE WANT TO SHOW
        const scouters = await prismaClient.scouter.findMany({
            where :
            {
                sourceTeamNumber : req.user.teamNumber
            },
            include :
            {
               scoutReports : true
            }
        })
        const formattedScouters = scouters.map(scouter => ({
            scouterUuid: scouter.uuid,
            scouterName: scouter.name,
            matchesScouted: scouter.scoutReports.length
          }));
        res.status(200).send(formattedScouters)
    }
    catch(error)
    {
        console.log(error)
        res.status(500).send(error)
    }
    
};