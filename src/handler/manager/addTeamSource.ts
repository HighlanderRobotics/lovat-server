import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";
import { todo } from "node:test";
import { all } from "axios";


export const addTeamSource = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = req.user
        if (req.body.mode === "ALL_TEAMS") {
            const allTeams = await prismaClient.team.findMany({})
            const row = await prismaClient.user.update({
                where: {
                    id: user.id
                },
                data: {
                    teamSource: allTeams.map(obj => obj.number)
                }
            })
            res.status(200).send("team sources added")
            return
        }
        else if (req.body.mode === "THIS_TEAM") {
            if (user.teamNumber === null) {
                res.status(400).send("Not affliated with a team")
                return
            }
            else {
                const row = await prismaClient.user.update({
                    where: {
                        id: user.id
                    },
                    data: {
                        teamSource: [user.teamNumber]
                    }
                })
                res.status(200).send("team sources added")
                return
            }
        }
        else {
            const params = z.object({
                teamSource: z.array(z.number())
            }).safeParse({
                teamSource: req.body.teams
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
                    teamSource: params.data.teamSource
                }
            })
            res.status(200).send("team sources added")
            return
        }

    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};


