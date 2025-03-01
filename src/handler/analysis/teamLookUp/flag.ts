import prismaClient from '../../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { arrayAndAverageTeam } from "../coreAnalysis/arrayAndAverageTeam";
import { rankFlag } from "../rankFlag";
import { Metric } from '../analysisConstants';


export const flag = async (req: AuthenticatedRequest, flag: string) => {
    try {
        const params = z.object({
            team: z.number(),
        }).safeParse({
            team: Number(req.params.team),
        })
        if (!params.success) {
            throw (params);
        };

        if (flag === "rank") {
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
                return { flag: flag, data: 0}
            }

            const data = await rankFlag(tournament.key, params.data.team)[params.data.team];
            return { flag: flag, data: data };
        }
        else {
            const metric = Metric[flag as keyof typeof Metric];
            if (!metric) {
                throw "bad flag string";
            }

            const data = await arrayAndAverageTeam(req.user, metric, params.data.team)
            return { flag: flag, data: data.average }
        }

    }
    catch (error) {
        console.error(error)
        throw (error)
    }

};