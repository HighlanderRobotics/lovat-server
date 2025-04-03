import { Response } from "express";
import z from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { rankFlag } from "../rankFlag";
import { metricsCategory, metricToName } from "../analysisConstants";
import { arrayAndAverageTeams } from "../coreAnalysis/arrayAndAverageTeams";


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

        const arr: number[] = []
        for (const flag of params.data.flags) {
            if (flag === "rank") {
                // Find team rank if a tournament is provided
                if (params.data.tournamentKey) {
                    arr.push((await rankFlag(params.data.tournamentKey, params.data.team))[params.data.team]);
                } else {
                    arr.push(0);
                }
            } else {
                // Map flag to a metric and use AAT (should probably use a map but wtv)
                for (let i = metricsCategory.length - 1; i >= 0; i--) {
                    if (flag === metricToName[metricsCategory[i]]) {
                        arr.push((await arrayAndAverageTeams([params.data.team], metricsCategory[i], req.user))[params.data.team].average);
                        break;
                    } else if (i === 0) {
                        // No flag found probably shouldnt throw a full error, just push a falsy
                        console.error(`Bad flag string: ${flag} for team ${params.data.team}`);
                        arr.push(NaN);
                    }
                }
            }
        }

        res.status(200).send(arr)
    }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};