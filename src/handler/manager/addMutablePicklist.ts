import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import { AuthenticatedRequest } from "../../requireAuth";

export const addMutablePicklist = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const rows = await prismaClient.mutablePicklist.create({
            data: {
                name: req.body.name,
                teams: req.body.teams,
                authorId: req.user.id,
            }
        });

        res.status(200).send(rows);
    } catch(error) {
        console.error(error);
        res.status(400).send(error);
    }
};
