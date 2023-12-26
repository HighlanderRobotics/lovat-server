import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";
import { singleMatchEventsAverage } from "./singleMatchEventsAverage";
import { arrayAndAverage } from "./arrayAndAverage";


export const nonEventMetric = async (req: AuthenticatedRequest, team : number, metric: string): Promise<Object> => {
    try {
        const params = z.object({
            //UPDATE WITH COLUMNS IN THE SCHEMA EACH YEAR
            column: z.enum([
                "robotRole"
            ]),
            team: z.number()
        }).safeParse({
            column: metric,
            team: team
        })
        if (!params.success) {
            throw (params)
        };
        const countArray = await prismaClient.scoutReport.groupBy({
            _count:
            {
                scouterUuid: true
            },
            where:
            {
                teamMatchData:
                {
                    teamNumber: params.data.team
                },
                scouter : 
                {
                    sourceTeamNumber :
                    {
                        in : req.user.teamSource
                    }
                }
            },
            by: [params.data.column]


        })
        const totalCount = countArray.reduce((acc, group) => acc + group._count.scouterUuid, 0);

        const transformedData = countArray.map(group => ({
            columnValue: group[params.data.column],
            percentage: group._count.scouterUuid / totalCount
        }));
        return transformedData
    } 
    catch (error) {
        console.error(error)
        throw (error)
    }

};