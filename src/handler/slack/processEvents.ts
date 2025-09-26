import { Request, Response } from "express";

export const processEvent = async (req: Request, res: Response): Promise<void> => {
    res.status(200).send(req.body.challenge)
}