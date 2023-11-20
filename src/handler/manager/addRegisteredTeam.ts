import { Request, Response } from "express";
import prismaClient from '../../prismaClient'


export const addRegisteredTeam = async (req: Request, res: Response): Promise<void> => {
    try {
           const rows = await prismaClient.registeredTeam.create({
            data: {
                email : req.body.email,
                number : req.body.number,
                code : await generateUniqueCode()
            }
        })
        //TODO send verification email
        res.status(200).send(rows);
    }
    catch(error)
    {
        console.error(error)
        res.status(400).send(error)
    }
    
};
async function generateUniqueCode() {
    let unique = false;
    let code : number;
    while (!unique) {
        code = Math.floor(100000 + Math.random() * 900000); // Generate a 6-digit code
        const exists = await prismaClient.registeredTeam.count({ where: { code: code } });
        unique = exists === 0;
    }
    return code;
}