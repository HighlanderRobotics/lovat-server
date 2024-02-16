import { Request, Response } from "express";
import prismaClient from '../../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { arrayAndAverageTeam } from "../coreAnalysis/arrayAndAverageTeam";
import { arrayAndAverageAllTeam } from "../coreAnalysis/arrayAndAverageAllTeams";
import { metricsCategory } from "../analysisConstants";
import { autoPathsTeam } from "../autoPaths/autoPathsTeam";
import { rankFlag } from "../rankFlag";


export const flag = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const params = z.object({
            team: z.number(),
            flag: z.enum(["totalpoints","driverability", "teleoppoints", "autopoints", "pickups", "ampscores", "speakerscores", "feeds", "trapscores", "drops", "rank"])
        }).safeParse({
            team: Number(req.params.team),
            flag: req.params.metric

        })
        if (!params.success) {
            res.status(400).send(params);
            return;
        };
        if(params.data.flag === "rank")
        {
            let tourament = await prismaClient.tournament.findFirst({
                where :
                {
                    teamMatchData :
                    {
                        some :
                        {
                            teamNumber : params.data.team
                        }
                    }
                },
                orderBy :
                {
                    date : "desc"
                }
            })
            let data = await rankFlag(req, "frc" + params.data.team, tourament.key)
            res.status(200).send({flag : params.data.flag, "data" : data})
        }
        else
        {
            let data = await arrayAndAverageTeam(req, params.data.flag, params.data.team)
            res.status(200).send({flag : params.data.flag, data : data.average})
        }
       
    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};