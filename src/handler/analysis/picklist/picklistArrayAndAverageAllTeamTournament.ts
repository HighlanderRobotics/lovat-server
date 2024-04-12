import { Request, Response } from "express";
import prismaClient from '../../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { autoEnd, matchTimeEnd, teleopStart } from "../analysisConstants";
import { arrayAndAverageTeam } from "../coreAnalysis/arrayAndAverageTeam";
import { error, time } from "console";
import { Position, User } from "@prisma/client";
import { arrayAndAverageTeamFast } from "../coreAnalysis/arrayAndAverageTeamFast";


export const picklistArrayAndAverageAllTeamTournament = async (user: User, metric: string, teams : Array<number>) : Promise<{average : number, teamAverages : Map<number, number>, timeLine : Array<number>}>=> {
    try {

       
        let timeLineArray = []
        for (const team of teams) {
            const currAvg = ( arrayAndAverageTeamFast(user, metric, team))
            timeLineArray.push(currAvg)
            // await wait(75)
        };
        //change to null possibly
        let average = 0
        let teamAveragesMap : Map<number, number> = new Map()
        await Promise.all(timeLineArray).then((values) => {
            if (values.length !== 0) {
                average = values.reduce((acc, cur) => acc + cur.average, 0) / values.length;
            }
            timeLineArray =  values.map(item => item.average);
             teams.forEach((teamNumber, index) => {
                let currAvg = values[index].average
                if(!currAvg)
                {
                    currAvg = 0
                }
                teamAveragesMap[teamNumber] = currAvg;
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

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}