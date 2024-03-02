import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";


export const getPicklists = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = req.user
        if(user.teamNumber === null)
        {
            res.status(403).send("Not authortized to get mutable picklists because your not on a team")
            return
        }
        const rows = await prismaClient.sharedPicklist.findMany({
            where:
            {
                author: {
                    teamNumber: user.teamNumber
                }
            },
            select :
            {
                name : true,
                uuid : true,
                author :
                {
                    select : {
                        username : true
                    }
                }
            }

        })
        res.status(200).send(rows);
    }
    catch (error) {
        console.error(error)
        res.status(500).send(error)
    }

};