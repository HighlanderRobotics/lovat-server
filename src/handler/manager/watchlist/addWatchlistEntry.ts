import { Response } from "express";
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import z from "zod";
import prismaClient from "../../../prismaClient";

const requestSchema = z.object({
    note: z.string(),
    teamNumber: z.coerce.number()
})

export const addWatchlistEntry = async (req: AuthenticatedRequest, res: Response) => {
    try {
    const params = requestSchema.parse(req.query);

    const entryRow = await prismaClient.watchlistEntry.create({
        data: {
            note: params.note,
            teamNumber: params.teamNumber,
            userId: "pepecaca"
        }
    })

    res.status(200).send({entry: entryRow})
} catch (e) {
    console.error(e)
    res.status(500).send("Internal Server Error")
}
}