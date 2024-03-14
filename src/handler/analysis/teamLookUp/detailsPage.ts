import { Request, Response } from "express";
import prismaClient from '../../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { arrayAndAverageTeam } from "../coreAnalysis/arrayAndAverageTeam";
import { arrayAndAverageAllTeam } from "../coreAnalysis/arrayAndAverageAllTeams";
import { metricsCategory } from "../analysisConstants";
import { autoPathsTeam } from "../autoPaths/autoPathsTeam";
import { averageAllTeamOneQuerey } from "../coreAnalysis/averageAllTeamsOneQuerey";


export const detailsPage = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const params = z.object({
            team: z.number(),
            metric: z.enum(["totalpoints", "driverability", "teleoppoints", "autopoints", "pickups", "ampscores", "speakerscores", "feeds", "trapscores", "drops", "scores"])
        }).safeParse({
            team: Number(req.params.team),
            metric: req.params.metric

        })
        if (!params.success) {
            res.status(400).send(params);
            return;
        };
        if (params.data.metric === "autopoints") {
            const autoPaths = await autoPathsTeam(req.user, params.data.team)
            res.status(200).send({ paths: autoPaths })
            return
        }
        else if (params.data.metric === "scores") {
            let teamAverageAndTimeLine = await arrayAndAverageTeam(req.user, params.data.metric, params.data.team)
            let allTeamAverage = await averageAllTeamOneQuerey(req.user, params.data.metric)
            // let ampScores = await arrayAndAverageTeam(req.user, "ampscores", params.data.team)
            let speakerScores = await arrayAndAverageTeam(req.user, "speakerscores", params.data.team)

            let result = {
                array: speakerScores,
                result: teamAverageAndTimeLine.average,
                all: allTeamAverage,
                difference: teamAverageAndTimeLine.average - allTeamAverage,
                team: params.data.team
            }
            res.status(200).send(result)
        }
        else {
            let teamAverageAndTimeLine = await arrayAndAverageTeam(req.user, params.data.metric, params.data.team)
            let allTeamAverage = await averageAllTeamOneQuerey(req.user, params.data.metric)
            let result = {
                array: teamAverageAndTimeLine.timeLine,
                result: teamAverageAndTimeLine.average,
                all: allTeamAverage,
                difference: teamAverageAndTimeLine.average - allTeamAverage,
                team: params.data.team
            }
            res.status(200).send(result)
        }
    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};