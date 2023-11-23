import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../requireAuth";
import { getUser } from "./getUser";


export const checkCode = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = await getUser(req, res)
        if (user === null) {
            return
        }
        const CodeSchema = z.object({
            code: z.string()
        })
        const currCode = { code: req.query.code }
        const possibleTypeError = CodeSchema.safeParse(currCode)
        if (!possibleTypeError.success) {
            res.status(400).send(possibleTypeError)
            return
        }
        const teamWithCode = await prismaClient.registeredTeam.findUnique({
            where: 
            {
                code : String(req.query.code)
            }
        })
        if (teamWithCode) {


            const row = await prismaClient.user.update({
                where: {
                    id: user.id
                },
                data:
                {
                    teamNumber: teamWithCode.number
                }
            })
            res.status(200).send(true)

        }
        else
        {
            res.status(200).send(false)

        }

    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};


