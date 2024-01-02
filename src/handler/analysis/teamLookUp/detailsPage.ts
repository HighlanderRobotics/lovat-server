import { Request, Response } from "express";
import prismaClient from '../../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { arrayAndAverageTeam } from "../coreAnalysis/arrayAndAverageTeam";
import { arrayAndAverageAllTeam } from "../coreAnalysis/arrayAndAverageAllTeams";


export const detailsPage = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const params = z.object({
            team: z.number(),
            //add more, game specfic
            metric: z.enum(["driverAbility", "totalPoints"])
        }).safeParse({
            team: Number(req.params.team),
            metric: req.params.metric

        })
        if (!params.success) {
            res.status(400).send(params);
            return;
        };
        let teamAverageAndTimeLine = await arrayAndAverageTeam(req, params.data.metric, params.data.team)
        let allTeamAverage = await arrayAndAverageAllTeam(req, params.data.metric)
        let result = {
            timeLine: teamAverageAndTimeLine.timeLine,
            average : teamAverageAndTimeLine.average,
            allTeamAverage : allTeamAverage.average,
            difference : teamAverageAndTimeLine.average - allTeamAverage.average
        }
        res.status(200).send(result)
    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};