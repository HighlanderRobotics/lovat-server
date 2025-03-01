
import { Response } from "express";
import prismaClient from '../../../prismaClient'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import z from 'zod'
import { Worker } from 'worker_threads';
import { addTournamentMatches } from "../../manager/addTournamentMatches";
import { Metric, metricsCategory, metricToEvent, metricToName, picklistToMetric } from "../analysisConstants";
import { picklistArrayAndAverage } from "./picklistArrayAndAverage";
import flatted from 'flatted';
import os from 'os'
import { WorkerResponseData } from "./zScoreTeam";


// OK so normal metrics are sent and received in the lettering suggested by the query inputs, but FLAGS are sent and received as shown in metricToName
export const picklistShell = async (req: AuthenticatedRequest, res: Response) => {
    try {

        if (req.query.totalPoints) {
            res.status(400).send({"error" : req.query, "displayError" : "Invalid input. Make sure you are using the correct input."});
            return;
        }

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
                "totalpoints": Number(req.query.totalpoints) || 0,
                "autopoints": Number(req.query.autopoints) || 0,
                "teleoppoints": Number(req.query.teleoppoints) || 0,
                "driverability": Number(req.query.driverability) || 0,
                "bargeresult": Number(req.query.bargeresult) || 0,
                "level1": Number(req.query.level1) || 0,
                "level2": Number(req.query.level2) || 0,
                "level3": Number(req.query.level3) || 0,
                "level4": Number(req.query.level4) || 0,
                "coralpickup": Number(req.query.coralpickup) || 0,
                "algaeProcessor": Number(req.query.algaeProcessor) || 0,
                "algaeNet": Number(req.query.algaeNet) || 0,
                "algaePickups": Number(req.query.algaePickups) || 0,
                "feeds": Number(req.query.feeds) || 0,
                "defends": Number(req.query.defends) || 0
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

        // Retrieve raw data from worker function
        const allTeamData: Partial<Record<Metric, { average: number, teamAverages: Record<number, number>, std: number }>> = {};
        for (const [picklistParam, metric] of Object.entries(picklistToMetric)) {
            if (params.data.metrics[picklistParam]) {
                allTeamData[metric] = await picklistArrayAndAverage(req.user, metric, includedTeamNumbers);
            }
        }
        for (const metric of metricsCategory) {
            if (params.data.flags.includes(metricToName[metric])) {
                allTeamData[metric] ||= await picklistArrayAndAverage(req.user, metric, includedTeamNumbers);
            }
        }

        // Split workload across cpu's
        const teamBreakdowns = []
        const teamChunks = splitArray(includedTeamNumbers, os.cpus().length - 1);
        for (const teams of teamChunks) {
            if (teams.length > 0) {
                teamBreakdowns.push(createWorker(teams, allTeamData, params.data.flags, params.data.metrics, params.data.tournamentKey));
            }
        }

        // Resolve all the work
        const dataArr = []
        await Promise.all(teamBreakdowns).then((data: WorkerResponseData[]) => {
            // Format data
            for (const chunk of data) {
                for (const currTeamData of chunk) {
                    if (!isNaN(currTeamData.zScore)) {
                        const temp = { "team": currTeamData.team, "result": currTeamData.zScore, "breakdown": currTeamData.adjusted, "unweighted": currTeamData.unadjusted, "flags": currTeamData.flags }
                        dataArr.push(temp)
                    }
                }
            }

            // Sort and send
            const resultArr = dataArr.sort((a, b) => b.result - a.result)
            res.status(200).send({ teams: resultArr })
        })
    }
    catch (error) {
        console.log(error)
        res.status(400).send(error)
    }
}

// Multithreading picklists
function createWorker(teams: number[], allTeamData: Partial<Record<Metric, { average: number, teamAverages: Record<number, number>, std: number }>>, flags: string[], queries: Record<string, number>, tournamentKey: string) {
    return new Promise((resolve, reject) => {
        const data = {
            teams: teams,
            allTeamData: flatted.stringify(allTeamData),
            flags: flags,
            queries: flatted.stringify(queries),
            tournamentKey: tournamentKey
        }

        // Create worker and send data
        const worker = new Worker('./dist/handler/analysis/picklist/zScoreTeam.js')
        worker.postMessage(data);

        // Receive data and send to aggregation in main function
        worker.on('message', (event) => {
            resolve(event);
            worker.terminate();
        });

        worker.on('error', (error) => {
            reject(error);
            worker.terminate();
        });
    })
}

// Separate array into n new arrays
function splitArray(teams: number[], n: number): number[][] {
    const splitSize = Math.ceil(teams.length / n);
    const result: number[][] = [];

    for (let i = 0; i < n; i++) {
        const start = i * splitSize;
        const end = start + splitSize;
        result.push(teams.slice(start, end));
    }

    return result;
}