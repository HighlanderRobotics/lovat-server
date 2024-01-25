import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";
import { flag } from "./flag";


export const scoutingLead = async (req: AuthenticatedRequest, res : Response) => {
    try {
        if(req.user.role !== "SCOUTING_LEAD")
        {
            res.status(401).send("Not authorized to delete this picklist")
        }
        const flaggedMatches = await prismaClient.flaggedScoutReport.findMany({
            where :
            {
                scoutReport :
                {
                    scouter :
                    {
                        sourceTeamNumber : req.user.teamNumber
                    }
                }
            },
            select :
            {
                note : true,
                scoutReportUuid : true,
                scoutReport :
                {
                    select :
                    {
                        scouter : {
                            select :
                            {
                                name : true
                            }
                        }
                    }
                }
            }


        })
        res.status(200).send(flaggedMatches)

    }
    catch (error) {
       res.status(400).send(error)
    }

};