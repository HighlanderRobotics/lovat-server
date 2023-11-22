import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { getUser } from "./getUser";


export const getPicklists = async (req: Request, res: Response): Promise<void> => {
    try {
        let user = await getUser(req, res)
        if(user === null)
        {
            return
        }
        const rows = await prismaClient.sharedPicklist.findMany({
            where: 
            {
                author: {
                    teamNumber : user.teamNumber
                }
            }

        })
        res.status(200).send(rows);
    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};