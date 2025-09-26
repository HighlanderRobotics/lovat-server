import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'

export const processEvent = async (req: Request, res: Response): Promise<void> => {
    res.status(200).send(req.body.challenge);
}