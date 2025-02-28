import prismaClient from '../../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { arrayAndAverageTeam } from "../coreAnalysis/arrayAndAverageTeam";
import { rankFlag } from "../rankFlag";
import { Metric } from '../analysisConstants';


export const flag = async (req: AuthenticatedRequest, metric: string) => {
    try {
        const params = z.object({
            team: z.number(),
            flag: z.nativeEnum(Metric).or(z.enum(["rank"]))
        }).safeParse({
            team: Number(req.params.team),
            flag: metric
        })
        if (!params.success) {
            throw (params);
        };

        if (params.data.flag === "rank") {
            const tournament = await prismaClient.tournament.findFirst({
                where:
                {
                    teamMatchData:
                    {
                        some:
                        {
                            teamNumber: params.data.team
                        }
                    }
                },
                select:
                {
                    key: true
                },
                orderBy:
                {
                    date: "desc"
                }
            });

            if (!tournament) {
                return { flag: params.data.flag, data: 0}
            }

            const data = await rankFlag("frc" + params.data.team, tournament.key);
            return { flag: params.data.flag, data: data };
        }
        else {
            const data = await arrayAndAverageTeam(req.user, params.data.flag, params.data.team)
            return { flag: params.data.flag, data: data.average }
        }

    }
    catch (error) {
        console.error(error)
        throw (error)
    }

};