import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { getUser } from "./getUser";
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";


export const getScoutReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = await getUser(req, res)
        if(user === null) 
        {
            return
        }
        const ScoutReportSchema = z.object({
            uuid : z.string()
        })
        const currScoutReport = 
        {
            uuid : req.params.uuid
        }
        const possibleTypeError = ScoutReportSchema.safeParse(currScoutReport)
        if (!possibleTypeError.success) {
            res.status(400).send(possibleTypeError)
            return
        }
        const scoutReport = await prismaClient.scoutReport.findUnique({
            where :  currScoutReport
        })
        if(!scoutReport)
        {
            res.status(404).send("Cannot find scout report")
            return
        }

        const events = await prismaClient.event.findMany({
            where :  {
                scoutReportUuid : req.params.uuid
            }
        })
        res.status(200).send({"scoutReport" : scoutReport, "events" : events});
    }
    catch(error)
    {
        console.error(error)
        res.status(400).send(error)
    }
    
};