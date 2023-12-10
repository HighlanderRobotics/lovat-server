import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";


export const addTournamentSource = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = req.user
        if (req.body.tournamentSource === "all tournaments") {
            const allTournaments = await prismaClient.tournament.findMany({})
            const row = await prismaClient.user.update({
                where: {
                    id: user.id
                },
                data: {
                    tournamentSource:  allTournaments.map(obj => obj.key)
                }
            })
            res.status(200).send("tournament sources added")
        }
        else {
            const params = z.object({
                tournamentSource: z.array(z.string())
            }).safeParse({
                tournamentSource: req.body.tournamentSource
            })

            if (!params.success) {
                res.status(400).send(params);
                return;
            };
            const row = await prismaClient.user.update({
                where: {
                    id: user.id
                },
                data: {
                    tournamentSource: params.data.tournamentSource
                }
            })
            res.status(200).send("tournament sources added")
        }

    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};


