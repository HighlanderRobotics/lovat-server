
import { Request, Response } from "express";
import prismaClient from '../../../prismaClient'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import ss from 'simple-statistics';
import prisma from '../../../prismaClient';
import z, { array } from 'zod'
const { Worker } = require('worker_threads');
import { addTournamentMatches } from "../../manager/addTournamentMatches";
import { picklistSliders } from "../analysisConstants";
import { picklistArrayAndAverageAllTeamTournament } from "./picklistArrayAndAverageAllTeamTournament";
import { workerData } from "worker_threads";
import flatted from 'flatted';
import { resolve } from "dns/promises";
import os from 'os'
import { picklistArrayAndAverageAllTeamNoTournament } from "./picklistArrayAndAverageAllTeamNoTournament";
import { all } from "axios";



export const picklistShell = async (req: AuthenticatedRequest, res: Response) => {
    try {
        let flags = []
        if (req.query.flags) {
            flags = JSON.parse(req.query.flags as string)
        }

        const params = z.object({
            tournamentKey: z.string().optional(),
            totalpoints: z.number(),
            pickups: z.number(),
            stage: z.number(),
            trapscores: z.number(),
            autopoints: z.number(),
            teleoppoints: z.number(),
            driverability: z.number(),
            defense: z.number(),
            speakerscores: z.number(),
            ampscores: z.number(),
            feeds: z.number(),
            flags: z.array(z.string())


        }).safeParse({
            tournamentKey: req.query.tournamentKey || undefined,
            totalpoints: Number(req.query.totalPoints) || 0,
            pickups: Number(req.query.pickUps) || 0,
            stage: Number(req.query.stage) || 0,
            trapscores: Number(req.query.trapScores) || 0,
            autopoints: Number(req.query.autoPoints) || 0,
            teleoppoints: Number(req.query.teleopPoints) || 0,
            driverability: Number(req.query.driverAbility) || 0,
            defense: Number(req.query.defense) || 0,
            speakerscores: Number(req.query.speakerScores) || 0,
            ampscores: Number(req.query.ampScores) || 0,
            feeds: Number(req.query.feeds) || 0,
            flags: flags

        })
        if (!params.success) {
            res.status(400).send(params);
            return;
        };
        //if tournament matches not in yet, attempt to add them
        const matches = await prismaClient.teamMatchData.findMany({
            where:
            {
                tournamentKey: params.data.tournamentKey
            }
        })
        if (matches === null || matches.length === 0) {
            await addTournamentMatches(params.data.tournamentKey)
        }
        const allTeamAvgSTD = {}
        let usedMetrics = []
        let metricAllTeamMaps = {}
        let includedTeamNumbers:number[] = []
        let allTeamData: Promise<{ average: number, teamAverages: Map<number, number>, timeLine: Array<number> }>[] = []
        if (params.data.tournamentKey) {
            const teamsAtTournament = await prismaClient.teamMatchData.groupBy({
                by: ["teamNumber"],
                where:
                {
                    tournamentKey: params.data.tournamentKey
                }
            })
            includedTeamNumbers = teamsAtTournament.map(team => team.teamNumber);
            for (const metric of picklistSliders) {
                if (params.data[metric] || params.data.flags.includes(metric)) {
                    const currData = picklistArrayAndAverageAllTeamTournament(req.user, metric, includedTeamNumbers);
                    allTeamData.push(currData)
                    usedMetrics.push(metric)
                    await wait(75)

                }
            }

        }
        else
        {
           res.status(200).send([])
           return
        }
        
        
        
        await Promise.all(allTeamData).then((allTeamDataResolved) => {
            for (let i = 0; i < allTeamDataResolved.length; i++) {
                let currData = allTeamDataResolved[i]
                let metric = usedMetrics[i]
                if (currData.average !== null && !isNaN(currData.average) && currData.average !== undefined && currData.timeLine.length >= 2 && (ss.standardDeviation(currData.timeLine))) {
                    allTeamAvgSTD[metric] = {
                        "allAvg": currData.average,
                        "arraySTD": ss.standardDeviation(currData.timeLine)
                    };
                }
                //will only happen at the very start of new season when theres not a lot of data
                else {
                    if (isNaN(currData.average)) {
                        allTeamAvgSTD[metric] = {
                            "allAvg": 0,
                            "arraySTD": 0.1
                        };
                    }
                    else {
                        allTeamAvgSTD[metric] = {
                            "allAvg": currData.average,
                            "arraySTD": 0.1
                        };
                    }
                }
                metricAllTeamMaps[metric] = currData.teamAverages
            }
        })
       let teamBreakdowns = []
        let teamChunks = splitTeams(includedTeamNumbers, os.cpus().length - 1)
        for (const teams of teamChunks) {
            if (teams.length > 0) {
                teamBreakdowns.push(createWorker(teams, metricAllTeamMaps, allTeamAvgSTD, params, req))
            }
        }
        let dataArr = []
        await Promise.all(teamBreakdowns).then(function (data) {
            for (let i = 0; i < data.length; i++) {
                let currTeamData = data[i]
                for (let j = 0; j < currTeamData.length; j++) {
                    let currZscores = currTeamData[j]
                    if (!isNaN(currZscores.zScore)) {
                        let temp = { "team": currZscores.team, "result": currZscores.zScore, "breakdown": currZscores.adjusted, "unweighted": currZscores.unadjusted, "flags": currZscores.flags }
                        dataArr.push(temp)
                    }
                }
            }
            const resultArr = dataArr.sort((a, b) => b.result - a.result)
            res.status(200).send({ teams: resultArr })
        })


    }
    catch (error) {
        console.log(error)
        res.status(400).send(error)
    }

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
function createWorker(teams, metricAllTeamMaps, allTeamAvgSTD, params, req) {
    return new Promise((resolve, reject) => {

        let data = {
            teams: teams,
            metricTeamAverages: flatted.stringify(metricAllTeamMaps),
            allTeamAvgSTD: allTeamAvgSTD,
            flags: params.data.flags,
            req: flatted.stringify(req),
            params: params
        }
        const worker = new Worker('././dist/handler/analysis/picklist/zScoreTeam.js', { type: "module" })
        worker.postMessage(data);

        worker.on('message', (event) => {
            resolve(event);
            worker.terminate()

        });

        worker.on('error', (error) => {
            reject(error);
            worker.terminate()
        });
    })
}
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}



