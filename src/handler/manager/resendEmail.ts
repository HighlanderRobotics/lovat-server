import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";
import { Resend } from 'resend';
import { sendSlackVerification } from "./sendSlackVerification";



export const resendEmail = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      
        const teamRow = await prismaClient.registeredTeam.findUnique({
            where: 
            {
                number : req.user.teamNumber
            }
        })
        if(teamRow === null)
        {
            res.status(404).send("team not found")
        }

        let verificationUrl = `lovat.app/verify/${teamRow.code}`
        const resend = new Resend(process.env.RESEND_KEY);

        resend.emails.send({
            from: 'noreply@lovat.app',
            to: req.body.email,
            subject: 'Lovat Email Verification',
            html: `<p>Welcome to Lovat, click <a href="${verificationUrl}" target="_blank">here</a> to verify your team email!</p>`
        });

        res.status(200).send("verification email sent")

    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};

