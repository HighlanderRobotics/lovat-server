import { Response } from "express";
import z from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { autoPathsTeam } from "../autoPaths/autoPathsTeam";
import { averageAllTeamFast } from "../coreAnalysis/averageAllTeamFast";
import { Metric, metricsToNumber} from "../analysisConstants";
import { arrayAndAverageTeams } from "../coreAnalysis/arrayAndAverageTeams";


export const detailsPage = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const params = z.object({
            team: z.number(),
            metric: z.nativeEnum(Metric)
        }).safeParse({
            team: Number(req.params.team),
            metric: metricsToNumber[req.params.metric]

        })
        if (!params.success) {
            console.log(params)
            res.status(400).send(params);
            return;
        };
        if (params.data.metric === Metric.autoPoints) {
            const autoPaths = await autoPathsTeam(req.user, params.data.team)
            res.status(200).send({ paths: autoPaths })
            return
        }
        // else if (params.data.metric === Metric.scores) {
        //     const teamAverageAndTimeLine = await arrayAndAverageTeam(req.user, params.data.metric, params.data.team)
        //     const allTeamAverage = await averageAllTeamOneQuery(req.user, params.data.metric)
        //     // let ampScores = await arrayAndAverageTeam(req.user, "ampscores", params.data.team)
        //     const speakerScores = await arrayAndAverageTeam(req.user, Metric.speakerscores, params.data.team)

        //     const result = {
        //         array: speakerScores,
        //         result: teamAverageAndTimeLine.average,
        //         all: allTeamAverage,
        //         difference: teamAverageAndTimeLine.average - allTeamAverage,
        //         team: params.data.team
        //     }
        //     res.status(200).send(result)
        // }
        else {
            const teamAverageAndTimeLine = (await arrayAndAverageTeams([params.data.team], params.data.metric, req.user))[params.data.team]
            const allTeamAverage = await averageAllTeamFast(params.data.metric, req.user)
            const result = {
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