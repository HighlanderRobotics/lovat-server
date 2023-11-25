import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";

const UserSchema = z.object({
    id : z.string(),
    email : z.string().email(),
    teamNumber : z.number(),
    username : z.string(),
    role : z.enum(["ANALYST", "SCOUTING_LEAD"])

})
type UserData = z.infer<typeof UserSchema>;



export const getUser = async (req: AuthenticatedRequest, res: Response): Promise<UserData> => {
    try {
       let userID = req.user.id

        if(typeof(userID) !== "string")
        {
            res.status(400).send("UserID incorrect")
            return null
        }
        else
        {
            const user = await prismaClient.user.findUnique({
                where: {
                    id : userID
                }
            })
            if(!user)
            {
                res.status(401).send("user not found")
                return null
            }
            else
            {
                return user
            }
        }
    }
    catch(error)
    {
        console.error(error)
        res.status(400).send(error)
        return null
    }
    
};