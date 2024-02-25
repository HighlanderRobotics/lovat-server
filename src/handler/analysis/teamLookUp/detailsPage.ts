import { Request, Response } from "express";
import prismaClient from '../../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { arrayAndAverageTeam } from "../coreAnalysis/arrayAndAverageTeam";
import { arrayAndAverageAllTeam } from "../coreAnalysis/arrayAndAverageAllTeams";
import { metricsCategory } from "../analysisConstants";
import { autoPathsTeam } from "../autoPaths/autoPathsTeam";


export const detailsPage = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const params = z.object({
            team: z.number(),
            metric: z.enum(["totalpoints","driverability", "teleoppoints", "autopoints", "pickups", "ampscores", "speakerscores", "feeds", "trapscores", "drops"])
        }).safeParse({
            team: Number(req.params.team),
            metric: req.params.metric

        })
        if (!params.success) {
            res.status(400).send(params);
            return;
        };
        if(params.data.metric === "autopoints")
        {
            const autoPaths = await autoPathsTeam(req, params.data.team)
            res.status(200).send({paths : autoPaths})
            return
        }
        let teamAverageAndTimeLine = await arrayAndAverageTeam(req, params.data.metric, params.data.team)
        let allTeamAverage = await arrayAndAverageAllTeam(req, params.data.metric)
        let result = {
            array: teamAverageAndTimeLine.timeLine,
            result : teamAverageAndTimeLine.average,
            all : allTeamAverage.average,
            difference : teamAverageAndTimeLine.average - allTeamAverage.average,
            team : params.data.team
        }
        res.status(200).send(result)
    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};