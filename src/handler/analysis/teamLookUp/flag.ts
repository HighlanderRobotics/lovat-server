import prismaClient from '../../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { arrayAndAverageTeam } from "../coreAnalysis/arrayAndAverageTeam";
import { rankFlag } from "../rankFlag";


export const flag = async (req: AuthenticatedRequest, metric: string) => {
    try {
        const params = z.object({
            team: z.number(),
            flag: z.enum(["totalpoints", "driverability", "teleoppoints", "autopoints", "pickups", "ampscores", "speakerscores", "feeds", "trapscores", "drops", "rank", "defense"])
        }).safeParse({
            team: Number(req.params.team),
            flag: metric

        })
        if (!params.success) {
            throw (params);
        };
        if (params.data.flag === "rank") {
            const tourament = await prismaClient.tournament.findFirst({
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
                orderBy:
                {
                    date: "desc"
                }
            })
            if (tourament === null) {
                return { flag: params.data.flag, "data": 0 }
            }
            else {
                const data = await rankFlag(req.user, "frc" + params.data.team, tourament.key)
                return { flag: params.data.flag, "data": data }
            }
        }
        else {
            const data = await arrayAndAverageTeam(req.user, params.data.flag, params.data.team)
            console.log(data)
            return { flag: params.data.flag, data: data.average }
        }

    }
    catch (error) {
        console.error(error)
        throw (error)
    }

};