import { Response } from "express";
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import z from "zod";
import prismaClient from "../../../prismaClient";


export const getWatchlistEntry = async (req: AuthenticatedRequest, res: Response) => { //this line creates the function and takes in a request and response.
    try {
    const entryRows = await prismaClient.watchlistEntry.findMany({
        where: {
            userId: req.user.id //This line accesses the database and finds a watchlist entry where the userID equals the users ID
        }
    })

    res.status(200).send({entries: entryRows}) //This tells the server tells the server that its all good
} catch (e) {
    console.error(e) //Otherwise, if everything is not all good, return a server error
    res.status(500).send("Internal Server Error")
}
}