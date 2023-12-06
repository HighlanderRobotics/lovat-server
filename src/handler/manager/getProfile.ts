import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";


export const getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {

        const rows = await prismaClient.user.findUnique({
            where:
            {
                id: req.user.id
            }

        })
        res.status(200).send(rows);
    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};