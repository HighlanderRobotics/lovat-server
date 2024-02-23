import { Request, Response } from "express";
import prismaClient from '../../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { arrayAndAverageTeam } from "../coreAnalysis/arrayAndAverageTeam";
import { arrayAndAverageAllTeam } from "../coreAnalysis/arrayAndAverageAllTeams";
import { metricsCategory } from "../analysisConstants";
import { autoPathsTeam } from "../autoPaths/autoPathsTeam";
import { rankFlag } from "../rankFlag";
import { flag } from "./flag";


export const multipleFlags = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const params = z.object({
            team: z.number(),
            flags : z.array(z.string()),
            tournamentKey : z.string().nullable()
        }).safeParse({
            team: Number(req.params.team),
            flags : JSON.parse(req.query.flags as string) || [],
            tournamentKey : req.query.tournamentKey || null
        })
        if (!params.success) {
            res.status(400).send(params);
            return;
        };
        let arr = []
        for(const metric of params.data.flags)
        {
            if(metric === "rank" && !params.data.tournamentKey)
            {
                arr.push(0)
            }
            else
            {
                arr.push((await flag(req, metric)).data)
            }
        }
        res.status(200).send(arr)
       
       
    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};