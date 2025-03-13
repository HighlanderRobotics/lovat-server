
import { Response } from "express";
import prismaClient from '../../../prismaClient'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import z from 'zod'
import { Worker } from 'worker_threads';
import { addTournamentMatches } from "../../manager/addTournamentMatches";
import { allTeamNumbers, allTournaments, Metric, metricsCategory, metricToName, picklistToMetric } from "../analysisConstants";
import flatted from 'flatted';
import { arrayAndAverageManyFast, getSourceFilter } from "../coreAnalysis/arrayAndAverageManyFast";
import { zScoreMany } from "./zScoreMany";


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
                "totalpoints": Number(req.query.totalpoints) || Number(req.body.totalpoints) || 0,
                "autopoints": Number(req.query.autopoints) || Number(req.body.autopoints) || 0,
                "teleoppoints": Number(req.query.teleoppoints) || Number(req.body.teleoppoints) || 0,
                "driverability": Number(req.query.driverability) || Number(req.body.driverability) || 0,
                "bargeresult": Number(req.query.bargeresult) || Number(req.body.bargeresult) || 0,
                "level1": Number(req.query.level1) || Number(req.body.level1) || 0,
                "level2": Number(req.query.level2) || Number(req.body.level2) || 0,
                "level3": Number(req.query.level3) || Number(req.body.level3) || 0,
                "level4": Number(req.query.level4) || Number(req.body.level4) || 0,
                "coralpickup": Number(req.query.coralpickup) || Number(req.body.coralpickup) || 0,
                "algaeProcessor": Number(req.query.algaeProcessor) || Number(req.body.algaeProcessor) || 0,
                "algaeNet": Number(req.query.algaeNet) || Number(req.body.algaeNet) || 0,
                "algaePickups": Number(req.query.algaePickups) || Number(req.body.algaePickups) || 0,
                "feeds": Number(req.query.feeds) || Number(req.body.feeds) || 0,
                "defends": Number(req.query.defends) || Number(req.body.defends) || 0
            }
        })
        if (!params.success) {
            res.status(400).send(params);
            return;
        };

        if (isFinite(Number(req.query.stage))) {
            res.status(400).send({ error: "OUTDATED_PICKLIST" });
            return;
        }

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
        const includedTeams = teamsAtTournament.map(team => team.teamNumber);
        if (includedTeams.length === 0) {
            throw "Bad event, not enough teams"
        }

        // Metrics to aggregate
        const includedMetrics: Metric[] = [];
        for (const picklistParam in picklistToMetric) {
            if (params.data.metrics[picklistParam]) {
                includedMetrics.push(picklistToMetric[picklistParam]);
            }
        }
        for (const metric of metricsCategory) {
            if (params.data.flags.includes(metricToName[metric])) {
                includedMetrics.push(metric);
            }
        }

        const allTeamData = await arrayAndAverageManyFast(req.user, includedMetrics, includedTeams, getSourceFilter<number>(req.user.teamSource, await allTeamNumbers), getSourceFilter<string>(req.user.tournamentSource, await allTournaments));

        const dataArr = await zScoreMany(allTeamData, includedTeams, params.data.tournamentKey, params.data.metrics, params.data.flags);

        const resultArr = dataArr.sort((a, b) => b.result - a.result);
        res.status(200).send({ teams: resultArr });
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