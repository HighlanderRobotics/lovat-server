import { Response } from "express";
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import z from "zod";
import prismaClient from "../../../prismaClient";

const requestSchema = z.object({
    id: z.string()})

export const deleteWatchlistEntry = async (req: AuthenticatedRequest, res: Response) => {
    try {
    const params = requestSchema.parse(req.query);

    const entryRow = await prismaClient.watchlistEntry.delete({
        where: {
            id: params.id
        }
    })

    res.status(200).send({entry: entryRow})
} catch (e) {
    console.error(e)
    res.status(500).send("Internal Server Error")
}
}