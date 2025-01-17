import prismaClient from '../../../prismaClient'
import z from 'zod'
import { FlippedRoleMap } from "../analysisConstants";
import { User } from "@prisma/client";


export const robotRole = async (user: User, team: number): Promise<{mainRole : string}> => {
    try {
        const params = z.object({
            team: z.number()
        }).safeParse({
            team: team
        })
        if (!params.success) {
            throw (params)
        };
        const roles = await prismaClient.scoutReport.groupBy({
            by: ['robotRole'],
            _count:
            {
                robotRole: true
            },
            where:
            {
                scouter:
                {
                    sourceTeamNumber:
                    {
                        in: user.teamSource
                    }
                },
                teamMatchData:
                {
                    tournamentKey:
                    {
                        in: user.tournamentSource
                    },
                    teamNumber: params.data.team
                }
            }
        })
        let eventTypeWithMostOccurrences = null;
        let maxCount = 0;
        for (const element of roles) {
            if (element._count.robotRole > maxCount) {
                maxCount = element._count.robotRole;
                eventTypeWithMostOccurrences = element.robotRole;
            }
        };
        return {
            mainRole : FlippedRoleMap[eventTypeWithMostOccurrences]
        }


    }
    catch (error) {
        console.error(error)
        throw (error)
    }

};