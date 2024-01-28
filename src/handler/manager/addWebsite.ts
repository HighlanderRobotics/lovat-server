import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";
import { sendSlackVerification } from "./sendSlackVerification";


export const addWebsite = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = req.user

        const WebsiteSchema = z.object({
            website: z.string()
        })
        
        const currWebsite = { website: req.body.website }
        const possibleTypeErrorShift = WebsiteSchema.safeParse(currWebsite)
        if (!possibleTypeErrorShift.success) {
            res.status(400).send(possibleTypeErrorShift)
            return
        } const row = await prismaClient.registeredTeam.update({
            where: {
                number: user.teamNumber
            },
            data: currWebsite
        })

        await sendSlackVerification(row.number, row.email, req.body.website)
        res.status(200).send("Slack verification sent")
    }
    catch (error) {
        console.error(error)
        res.status(500).send(error)
    }

};


