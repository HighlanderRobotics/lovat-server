import { Request, Response } from "express";
import prismaClient from '../../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { singleMatchEventsAverage } from "./singleMatchEventsAverage";
import { arrayAndAverageTeam } from "./arrayAndAverageTeam";
import { User, ScoutReport } from "@prisma/client";


export const nonEventMetric = async (user: User, team : number, metric: string): Promise<Object> => {
    try {
        const params = z.object({
            // UPDATE WITH COLUMNS IN THE SCHEMA EACH YEAR
            column: z.enum([
                checkPropertyKey<ScoutReport>("robotRole"),
                checkPropertyKey<ScoutReport>("pickUp"),
                checkPropertyKey<ScoutReport>("highNote"),
                checkPropertyKey<ScoutReport>("stage")
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
                    teamNumber: params.data.team,
                    tournamentKey :
                    {
                        in : user.tournamentSource
                    }
                },
                scouter : 
                {
                    sourceTeamNumber :
                    {
                        in : user.teamSource
                    }
                }
            },
            by: [params.data.column]
        })
        const totalCount = countArray.reduce((acc, group) => acc + group._count.scouterUuid, 0);
        const transformedData = countArray.reduce((acc, group) => {
            const columnValue = group[params.data.column as string].toLowerCase();
            const percentage = group._count.scouterUuid / totalCount;
            acc[columnValue] = percentage;
            return acc;
        }, {});
        return transformedData
    } 
    catch (error) {
        console.error(error)
        throw (error)
    }
};

// Throws compiler error if keys do not match properties
function checkPropertyKey<T>(key: keyof T) {
    return key;
}