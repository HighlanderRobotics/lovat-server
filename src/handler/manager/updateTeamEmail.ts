import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";
import { Resend } from "resend";


export const updateTeamEmail = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {

        const params = z.object({
            email: z.string().email()

        }).safeParse({
            email: req.query.email

        })
        if (!params.success) {
            res.status(400).send(params);
            return;
        };
        const emailRow = await prismaClient.registeredTeam.update({
            where:
            {
                number: req.user.teamNumber
            },
            data:
            {
                email: params.data.email
            }
        })

        const verificationUrl = `lovat.app/verify/${emailRow.code}`
        const resend = new Resend(process.env.RESEND_KEY);

        resend.emails.send({
            from: 'noreply@lovat.app',
            to: params.data.email,
            subject: 'Lovat Email Verification',
            html: `<p>Welcome to Lovat, click <a href="${verificationUrl}" target="_blank">here</a> to verify your team email!</p>`
        });

        res.status(200).send("verification email sent")

    } catch (error) {
        console.error(error);
        res.status(500).send("Error in deleting data");
    }
};
