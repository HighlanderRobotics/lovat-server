import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'


export const addRegisteredTeam = async (req: Request, res: Response): Promise<void> => {
    try {
        const RegisteredTeamSchema = z.object({
            email: z.string().email(),
            number: z.number(),
            sourceTeam: z.number()
        })
        const currRegistedTeam = {
            email: req.body.email,
            number: req.body.number,
            website: req.body.website,
            code: await generateUniqueCode()
        }
        const possibleTypeError = RegisteredTeamSchema.safeParse(currRegistedTeam)
        if (!possibleTypeError.success) {
            res.status(400).send(possibleTypeError)
            return
        }

        const rows = await prismaClient.registeredTeam.create({
            data: currRegistedTeam
        })
        //TODO send verification email
        res.status(200).send(rows);
    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};

// This feels a bit like bogosort, but we're probably not going to have enough teams to make it a problem.
// Also keep in mind that this should generate an alphanumeric string, not a number.
async function generateUniqueCode() {
    let unique = false;
    let code: number;
    while (!unique) {
        code = Math.floor(100000 + Math.random() * 900000); // Generate a 6-digit code
        const exists = await prismaClient.registeredTeam.count({ where: { code: code } });
        unique = exists === 0;
    }
    return code;
}