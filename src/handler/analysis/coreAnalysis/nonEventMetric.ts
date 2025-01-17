import prismaClient from '../../../prismaClient'
import z from 'zod'
import { User, ScoutReport } from "@prisma/client";
import { MetricsBreakdown } from "../analysisConstants";

/** Counts percentage reports of given metric */
export const nonEventMetric = async (user: User, team: number, metric: MetricsBreakdown): Promise<object> => {
    try {
        // Group reports by metric and count responses
        const countArray = await prismaClient.scoutReport.groupBy({
            _count:
            {
                scouterUuid: true
            },
            where:
            {
                teamMatchData:
                {
                    teamNumber: team,
                    tournamentKey:
                    {
                        in: user.tournamentSource
                    }
                },
                scouter:
                {
                    sourceTeamNumber:
                    {
                        in: user.teamSource
                    }
                }
            },
            by: [metric.toString() as keyof ScoutReport]
        })

        // Change into map of metric value -> percentage of reports
        const totalCount = countArray.reduce((acc, group) => acc + group._count.scouterUuid, 0);
        const transformedData = countArray.reduce((acc, group) => {
            const columnValue = group[metric.toString()].toLowerCase();
            const percentage = group._count.scouterUuid / totalCount;
            acc[columnValue] = percentage;
            return acc;
        }, {});

        return transformedData;
    }
    catch (error) {
        console.error(error)
        throw (error)
    }
};