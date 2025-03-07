import { Response } from "express";
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";
import prismaClient from '../../prismaClient';
import { Resend } from "resend";


export const emailTeamCode = async (req: AuthenticatedRequest, res: Response) => {
    try {

        if (!req.user.teamNumber) {
            res.status(400).send({"error" : req.user.teamNumber, "displayError" : "User has an invalid team number."});
        }

        const team = await prismaClient.registeredTeam.findUnique({
            where: {
                number: req.user.teamNumber
            }
        });

        if (!team) {
            res.status(400).send({"error" : req.user.teamNumber, "displayError" : "User's team is not registered."});
        }
        
        const teamCode = team.code
        const resend = new Resend(process.env.RESEND_KEY);

        resend.emails.send({
            from: 'noreply@lovat.app',
            to: team.email,
            subject: 'Lovat Team Code',
            html: `<p>Welcome to Lovat! Your team code is: ${teamCode}. If you have received this email in error, please ignore it.`
        });

        res.status(200).send({ teamEmail: team.email });

    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
}