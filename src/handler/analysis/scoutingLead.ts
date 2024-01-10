import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";


export const scoutingLead = async (req: AuthenticatedRequest, res : Response) => {
    try {
        const flaggedMatches = await prismaClient.flaggedScoutReport.findMany({
            where :
            {
                
            }
        })
    }
    catch (error) {
       res.status(400).send(error)
    }

};