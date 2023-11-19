import { Request, Response } from "express";

export const getExample = async (req: Request, res: Response): Promise<void> => {
    res.status(200).send('All good my dude');
};
