import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";


export const getScoutReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = req.user
       
        const params = z.object({
            uuid: z.string()
        }).safeParse({
            uuid: req.params.uuid
        })
        
        if (!params.success) {
            res.status(400).send(params);
            return;
        };
        const scoutReport = await prismaClient.scoutReport.findUnique({
            where: 
            {
                uuid : params.data.uuid
            }
        })
        
        if (!scoutReport) {
            res.status(404).send("Cannot find scout report")
            return
        }

        const events = await prismaClient.event.findMany({
            where: {
                scoutReportUuid: req.params.uuid
            }
        })
        res.status(200).send({ "scoutReport": scoutReport, "events": events });
    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};