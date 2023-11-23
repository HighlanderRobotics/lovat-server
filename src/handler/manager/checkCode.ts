import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../requireAuth";
import { getUser } from "./getUser";


export const checkCode = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = await getUser(req, res)
        if(user === null)
        {
            return
        }
        const CodeSchema = z.object({
            code : z.string()
        })
        const currCode = {code : req.query.code}
        const possibleTypeError = CodeSchema.safeParse(currCode)
        if (!possibleTypeError.success) {
            res.status(400).send(possibleTypeError)
            return
        }
        const code = await prismaClient.registeredTeam.findUnique({
            where : currCode
        })
        const row = await prismaClient.user.update({
            where : {
                id : user.id
            },
            data :
            {
                username : req.body.username
            }
        })
        res.status(200).send("username added")
        
    }
    catch(error)
    {
        console.error(error)
        res.status(400).send(error)
    }
    
};


