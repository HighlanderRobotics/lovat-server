import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { getUser } from "./getUser";
import { AuthenticatedRequest } from "../../requireAuth";
import { Resend } from 'resend';



export const addRegisteredTeam = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const RegisteredTeamSchema = z.object({
            email: z.string().email(),
            number: z.number(),
            code : z.string()
        })
        const currRegisteredTeam = {
            email: req.body.email,
            number: req.body.number,
            code: await generateUniqueCode()
        }
        const possibleTypeError = RegisteredTeamSchema.safeParse(currRegisteredTeam)
        if (!possibleTypeError.success) {
            res.status(400).send(possibleTypeError)
            return
        }
        const toggleFeatureRow = await prismaClient.featureToggle.findUnique({
            where: {
                feature : "fullRegistration"
            }
        })
        if(toggleFeatureRow.enabled)
        {
            currRegisteredTeam["teamApproved"] = true
        }
        const row = await prismaClient.registeredTeam.create({
            data: currRegisteredTeam 
        })
        const user = await getUser(req, res)
        if(user === null)
        {
            return
        }
        const userRow = await prismaClient.user.update({
            data: {
                teamNumber: req.body.number,
                role : "SCOUTING_LEAD"
            },
            where: 
            {
                id : user.id
            }
        })
    //sending email
    const resend = new Resend(process.env.RESEND_KEY);
        
        resend.emails.send({
          from: 'onboarding@resend.dev',
          to: req.body.email,
          subject: 'Hello World',
          html: '<p>Congrats on sending your <strong>first email</strong>!</p>'
        });
        res.status(200).send(row);
    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};


function generateAlphanumericCode(length: number = 6): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

async function generateUniqueCode(): Promise<string> {
    let unique = false;
    let code: string;

    while (!unique) {
        code = generateAlphanumericCode();

        const count = await prismaClient.registeredTeam.count({
            where: { code: code }
        });

        if (count === 0) {
            unique = true;
        }
    }

    return code;
}