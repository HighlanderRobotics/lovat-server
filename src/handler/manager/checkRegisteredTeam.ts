
import prismaClient from '../../prismaClient'
import z from 'zod'
import e, { Request, Response } from "express";
import { AuthenticatedRequest } from '../../lib/middleware/requireAuth';


export const checkRegisteredTeam = async (req: AuthenticatedRequest, res: Response) => {
    try {

        const params = z.object({
            number: z.number().min(0)
        }).safeParse({
            number: Number(req.params.team)
        })

        if (!params.success) {
            res.status(400).send(params);
            return;
        };

        const row = await prismaClient.registeredTeam.findUnique(
            {
                where: {
                    number: params.data.number,

                },
                include: {
                    users: true
                }
            }

        )
        const featureToggle = await prismaClient.featureToggle.findUnique({
            where: {
                feature: "fullRegistration"
            }
        })
        if (row === null) {
            res.status(200).send("NOT_STARTED")
        }
        else if (row.users[0].id === req.user.id) {

            if (row.emailVerified) {
                if (featureToggle.enabled && row.website != null || featureToggle.enabled === false) {
                    if (row.teamApproved) {
                        res.status(200).send("REGISTERED")
                    }
                    else {
                        res.status(200).send("PENDING_TEAM_VERIFICATION")
                    }
                }
                else
                {
                    res.status(200).send("PENDING_WEBSITE")

                }
            }
            else {

                res.status(200).send("PENDING_EMAIL_VERIFICATION")
            }
        }
        else {
            if (row.emailVerified && row.teamApproved) {
                res.status(200).send("REGISTERED")
            }
            else {
                res.status(200).send("PENDING")
            }
        }


    }
    catch (error) {
        console.error(error)
        res.status(400).send(error);

    }

};
