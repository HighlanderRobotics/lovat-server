import { Request, Response } from "express";
import prismaClient from '../../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { singleMatchEventsAverage } from "./singleMatchEventsAverage";
import { autoEnd, matchTimeEnd, teleopStart } from "../analysisConstants";
import { arrayAndAverageTeam } from "./arrayAndAverageTeam";
import { time } from "console";
import { Position } from "@prisma/client";


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
        let timeLineArray = []
        for (const element of uniqueTeamsArray) {
            const currAvg =  (await arrayAndAverageTeam(req, metric, element)).average
            timeLineArray = timeLineArray.concat(currAvg)
        };
        //change to null possibly
        let average = 0
        if(timeLineArray.length !== 0)
        {
            average = await timeLineArray.reduce((acc, cur) => acc + cur) / timeLineArray.length;
        }
        
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