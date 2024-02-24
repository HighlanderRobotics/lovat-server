import { Request, Response } from "express";
import prismaClient from '../../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { singleMatchEventsAverage } from "./singleMatchEventsAverage";
import { autoEnd, matchTimeEnd, teleopStart } from "../analysisConstants";
import { arrayAndAverageTeam } from "./arrayAndAverageTeam";
import { error, time } from "console";
import { Position } from "@prisma/client";
import flatted from 'flatted'
import { numericSort } from "simple-statistics";
const { Worker } = require('worker_threads');
import os from 'os'

export const arrayAndAverageAllTeam = async (req: AuthenticatedRequest, metric: string) : Promise<{average : number, timeLine : Array<number>, teamsAverage : Array<number> }>=> {
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
        const chunkedTeams = splitTeams(uniqueTeamsArray, os.cpus().length -1) 
        if(uniqueTeamsArray.length === 0)
        {
            return {
                average : 0,
                timeLine : [],
                teamsAverage : []
            }
        }
        let timeLineArray = []
        for (const teams of chunkedTeams) {
            if(teams.length > 0)
            {
                timeLineArray.push(createWorker(req, teams, metric))
            }
        };

        let average = 0
        let teamsAverage = []
        await Promise.all(timeLineArray).then((values) => {
            console.log(values)
            let converted1DArray = values.reduce((accumulator, currentValue) => accumulator.concat(currentValue), []);
            if (timeLineArray.length !== 0) {
                average = converted1DArray.reduce((acc, cur) => acc + cur.average, 0) / values.length;
            }
            timeLineArray = converted1DArray.map(item => item.average);
        });
        return {
            average: average,
            timeLine: timeLineArray,
            teamsAverage : teamsAverage
        }
  
    }
    catch (error) {
        console.error(error)
        throw (error)
    }

}
function createWorker(req, teams, metric) {
    return new Promise((resolve, reject) => {

        let data = {
            req: flatted.stringify(req),
            teams : teams,
            metric : metric
        }
        const worker = new Worker('././dist/handler/analysis/coreAnalysis/arrayAndAverageTeamWorker.js', {type : "module"})
        worker.postMessage(data);

        worker.on('message', (event) => {
            resolve(event);

        });

        worker.on('error', (error) => {
            reject(error);
        });
    })
}
 function splitTeams(teams: Array<number>, n: number): Array<Array<number>> {
    const splitSize = Math.ceil(teams.length / n);
    const result: Array<Array<number>> = [];

    for (let i = 0; i < n; i++) {
        let start = i * splitSize;
        let end = start + splitSize;
        result.push(teams.slice(start, end));
    }

    return result;
}