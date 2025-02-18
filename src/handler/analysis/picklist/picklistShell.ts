
import { Response } from "express";
import prismaClient from '../../../prismaClient'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import ss from 'simple-statistics';
import z from 'zod'
const { Worker } = require('worker_threads');
import { addTournamentMatches } from "../../manager/addTournamentMatches";
import { Metric, picklistToMetric } from "../analysisConstants";
import { picklistArrayAndAverage } from "./picklistArrayAndAverage";
import flatted from 'flatted';
import os from 'os'
import { SharedPicklist } from "@prisma/client";



export const picklistShell = async (req: AuthenticatedRequest, res: Response) => {
    try {
        let flags = []
        if (req.query.flags) {
            flags = JSON.parse(req.query.flags as string)
        }

        const params = z.object({
            tournamentKey: z.string().optional(),
            flags: z.array(z.string()),
            metrics: z.record(z.string(), z.number())
        }).safeParse({
            tournamentKey: req.query.tournamentKey || undefined,
            flags: flags,
            metrics: {
                "totalPoints": Number(req.query.totalPoints) || 0,
                "defense": Number(req.query.defense) || 0,
                "driverAbility": Number(req.query.driverAbility) || 0,
                "autoPoints": Number(req.query.autoPoints) || 0,
                "algaePickups": Number(req.query.algaePickups) || 0,
                "coralPickups": Number(req.query.coralPickups) || 0,
                "barge": Number(req.query.barge) || 0,
                "coralLevel1Scores": Number(req.query.coralLevel1Scores) || 0,
                "coralLevel2Scores": Number(req.query.coralLevel2Scores) || 0,
                "coralLevel3Scores": Number(req.query.coralLevel3Scores) || 0,
                "coralLevel4Scores": Number(req.query.coralLevel4Scores) || 0,
                "algaeProcessor": Number(req.query.algaeProcessor) || 0,
                "algaeNet": Number(req.query.algaeNet) || 0,
                "teleopPoints": Number(req.query.teleopPoints) || 0,
                "feeds": Number(req.query.feeds) || 0
            }
        })
        if (!params.success) {
            res.status(400).send(params);
            return;
        };

        // No data without a tournament key (should make this an impossible request from the frontend)
        if (!params.data.tournamentKey) {
            res.status(200).send([]);
            return;
        }

        //if tournament matches not in yet, attempt to add them
        const matches = await prismaClient.teamMatchData.findFirst({
            where:
            {
                tournamentKey: params.data.tournamentKey
            }
        })
        if (!matches) {
            await addTournamentMatches(params.data.tournamentKey)
        }

        // Teams to look at
        const teamsAtTournament = await prismaClient.teamMatchData.groupBy({
            by: ["teamNumber"],
            where: {
                tournamentKey: params.data.tournamentKey
            }
        });
        const includedTeamNumbers = teamsAtTournament.map(team => team.teamNumber);

        const usedMetrics: Metric[] = []
        const allTeamData: { average: number, teamAverages: Map<number, number>, timeLine: number[] }[] = []
        for (const [k, v] of Object.entries(picklistToMetric)) {
            if (params.data[k] || params.data.flags.includes(k)) {
                allTeamData.push(currData);
                usedMetrics.push(v);
                const currData = await picklistArrayAndAverage(req.user, metric, includedTeamNumbers);
            }
        }
    
        const allTeamAvgSTD = {}
        const metricAllTeamMaps = {}
        for (let i = 0; i < allTeamData.length; i++) {
            const currData = allTeamData[i]
            const metric = usedMetrics[i]
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
        
        const teamBreakdowns = []
        const teamChunks = splitTeams(includedTeamNumbers, os.cpus().length - 1)
        for (const teams of teamChunks) {
            if (teams.length > 0) {
                teamBreakdowns.push(createWorker(teams, metricAllTeamMaps, allTeamAvgSTD, params, req))
            }
        }
        const dataArr = []
        await Promise.all(teamBreakdowns).then(function (data) {
            for(const currTeamData of data){
                for (const currZscores of currTeamData) {
                    if (!isNaN(currZscores.zScore)) {
                        const temp = { "team": currZscores.team, "result": currZscores.zScore, "breakdown": currZscores.adjusted, "unweighted": currZscores.unadjusted, "flags": currZscores.flags }
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

function splitTeams(teams: number[], n: number): number[][] {
    const splitSize = Math.ceil(teams.length / n);
    const result: number[][] = [];

    for (let i = 0; i < n; i++) {
        const start = i * splitSize;
        const end = start + splitSize;
        result.push(teams.slice(start, end));
    }

    return result;
}

function createWorker(teams, metricAllTeamMaps, allTeamAvgSTD, params, req) {
    return new Promise((resolve, reject) => {

        const data = {
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