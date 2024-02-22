
import { Request, Response } from "express";
import prismaClient from '../../../prismaClient'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { arrayAndAverageAllTeam } from "../coreAnalysis/arrayAndAverageAllTeams";
import ss from 'simple-statistics';
import prisma from '../../../prismaClient';
import z, { array } from 'zod'
const { Worker } = require('worker_threads');
import { addTournamentMatches } from "../../manager/addTournamentMatches";
import { picklistSliders } from "../analysisConstants";
import { picklistArrayAndAverageAllTeam } from "./picklistArrayAndAverageAllTeam";
import { workerData } from "worker_threads";
import flatted from 'flatted';
import { resolve } from "dns/promises";




export const picklistShell = async (req: AuthenticatedRequest, res: Response) => {
    try {
        let flags = []
        if (req.query.flags) {
            flags = JSON.parse(req.query.flags as string)
        }

        const params = z.object({
            tournamentKey: z.string().optional(),
            totalPoints: z.number(),
            pickUps: z.number(),
            stage: z.number(),
            trapScores: z.number(),
            autoPoints: z.number(),
            teleopPoints: z.number(),
            driverAbility: z.number(),
            defense: z.number(),
            speakerScores: z.number(),
            ampScores: z.number(),
            cooperation: z.number(),
            feeds: z.number(),
            flags: z.array(z.string())


        }).safeParse({
            tournamentKey: req.query.tournamentKey || undefined,
            totalPoints: Number(req.query.totalPoints) || 0,
            pickUps: Number(req.query.pickUps) || 0,
            stage: Number(req.query.stage) || 0,
            trapScores: Number(req.query.trapScores) || 0,
            autoPoints: Number(req.query.autoPoints) || 0,
            teleopPoints: Number(req.query.teleopPoints) || 0,
            driverAbility: Number(req.query.driverAbility) || 0,
            defense: Number(req.query.defense) || 0,
            speakerScores: Number(req.query.speakerScores) || 0,
            ampScores: Number(req.query.ampScores) || 0,
            cooperation: Number(req.query.cooperation) || 0,
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
        let data = true
        let allTeamData: Promise<{ average: number, teamAverages: Map<number, number>, timeLine: Array<number> }>[] = []
        for (const element of picklistSliders) {
            const currData = picklistArrayAndAverageAllTeam(req, element);
            allTeamData.push(currData)
        }
        const metricAllTeamMaps = {}
        await Promise.all(allTeamData).then((allTeamDataResolved) => {
            for (let i = 0; i < allTeamDataResolved.length; i++) {
                let currData = allTeamDataResolved[i]
                let element = picklistSliders[i]
                if (currData.average !== null && !isNaN(currData.average) && currData.average !== undefined && currData.timeLine.length >= 2) {
                    allTeamAvgSTD[element] = {
                        "allAvg": currData.average,
                        "arraySTD": ss.standardDeviation(currData.timeLine)
                    };
                }
                //will only happen at the very start of new season when theres not a lot of data
                else {
                    if (isNaN(currData.average)) {
                        allTeamAvgSTD[element] = {
                            "allAvg": 0,
                            "arraySTD": 0.1
                        };
                    }
                    else {
                        allTeamAvgSTD[element] = {
                            "allAvg": currData.average,
                            "arraySTD": 0.1
                        };
                    }
                }
                metricAllTeamMaps[element] = currData.teamAverages
            }
        })


        const allTeams = await prismaClient.team.findMany({})
        let includedTeamNumbers: number[] = allTeams.map(team => team.number);
        if (params.data.tournamentKey) {
            const teamsAtTournament = await prismaClient.teamMatchData.groupBy({
                by: ["teamNumber"],
                where:
                {
                    tournamentKey: params.data.tournamentKey
                }
            })
            includedTeamNumbers = teamsAtTournament.map(record => record.teamNumber);

        }

        let teamBreakdowns = []
        //split teams for the cors
        let teamChunks = splitTeams(includedTeamNumbers, 16)
        for (const teams of teamChunks) {
            teamBreakdowns.push(createWorker(teams, metricAllTeamMaps, allTeamAvgSTD, params, req))
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
            metricTeamAverages: metricAllTeamMaps,
            allTeamAvgSTD: allTeamAvgSTD,
            flags: params.data.flags,
            req: flatted.stringify(req),
            params: params
        }
        const worker = new Worker('././dist/handler/analysis/picklist/zScoreTeam.js', { type: "module" })
        worker.postMessage(data);

        worker.on('message', (event) => {
            resolve(event);

        });

        worker.on('error', (error) => {
            reject(error);
        });
    })
}






