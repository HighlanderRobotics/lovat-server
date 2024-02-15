import { Request, Response } from "express";
import prismaClient from '../../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { autoEnd, matchTimeEnd, teleopStart } from "../analysisConstants";
import { arrayAndAverageTeam } from "../coreAnalysis/arrayAndAverageTeam";
import { error, time } from "console";
import { Position } from "@prisma/client";


export const picklistArrayAndAverageAllTeam = async (req: AuthenticatedRequest, metric: string) : Promise<{average : number, teamAverages : Map<number, number>, timeLine : Array<number>}>=> {
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
        const uniqueTeams: Set<number> = new Set();

        for (const element of teams) {
            if (element) {
                uniqueTeams.add(element.teamMatchData.teamNumber);
            }
        };
        const uniqueTeamsArray: Array<number> = Array.from(uniqueTeams);
        let timeLineArray = []
        for (const element of uniqueTeamsArray) {
            const currAvg = (arrayAndAverageTeam(req, metric, element))
            timeLineArray = timeLineArray.concat(currAvg)
        };
        //change to null possibly
        let average = 0
        let teamAveragesMap : Map<number, number> = new Map()
        await Promise.all(timeLineArray).then((values) => {

            if (timeLineArray.length !== 0) {
                average = values.reduce((acc, cur) => acc + cur.average, 0) / values.length;
            }
            timeLineArray = values.map(item => item.average);
            uniqueTeamsArray.forEach((teamNumber, index) => {
                teamAveragesMap[teamNumber] = values[index];
              });
               
        });
        return {
            average: average,
            teamAverages : teamAveragesMap,
            timeLine: timeLineArray
        }
  
    }
    catch (error) {
        console.error(error)
        throw (error)
    }

};