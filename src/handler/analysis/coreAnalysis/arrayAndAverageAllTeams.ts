import { Request, Response } from "express";
import prismaClient from '../../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { singleMatchEventsAverage } from "./singleMatchEventsAverage";
import { autoEnd, matchTimeEnd, teleopStart } from "../analysisConstants";
import { arrayAndAverageTeam } from "./arrayAndAverageTeam";


export const arrayAndAverageAllTeam = async (req: AuthenticatedRequest, metric: string): Promise<{ average: number, timeLine: Array<number> }> => {
    try {

        const teams = await prismaClient.scoutReport.findMany({
            where:
            {
                scouter:
                {
                    sourceTeamNumber:
                    {
                        in: req.user.teamSource
                    }
                },
                teamMatchData:
                {
                    tournamentKey:
                    {
                        in: req.user.tournamentSource
                    }
                }
            },
            include:
            {
                teamMatchData: true
            }
        })
        const uniqueTeams : Set<number>= new Set();

        for (const element of teams) {
            if (element) {
                uniqueTeams.add(element.teamMatchData.teamNumber);
            }
        };

        const uniqueTeamsArray : Array<number> = Array.from(uniqueTeams);
        const timeLineArray = []
        for (const element of uniqueTeamsArray) {
            timeLineArray.concat((await arrayAndAverageTeam(req, metric, element)).timeLine )
        };
        const average = timeLineArray.reduce((acc, cur) => acc + cur.dataPoint, 0) / timeLineArray.length;
        return {
            average: average,
            timeLine: timeLineArray
        }

    }
    catch (error) {
        console.error(error)
        throw (error)
    }

};