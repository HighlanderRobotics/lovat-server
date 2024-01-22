import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";


export const getTeamSource = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        res.status(200).send(req.user.teamSource)
    }
    catch (error) {
        console.error(error);
        res.status(400).send(error);
    }
};
    
