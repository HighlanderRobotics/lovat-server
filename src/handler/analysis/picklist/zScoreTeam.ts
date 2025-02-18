import { Metric, picklistToMetric } from "../analysisConstants";
import { parentPort } from 'worker_threads';
import { rankFlag } from '../rankFlag';
import flatted from 'flatted';
import prismaClient from "../../../prismaClient";

export type WorkerResponseData = {
    team: number,
    zScore: number,
    adjusted: { type: string, result: number }[],
    unadjusted: { type: string, result: number }[],
    flags: { type: string, result: number }[]
}[]

//worker for picklists
try {
    parentPort.on('message', async (data) => {
        return new Promise(async function (resolve) {

            // Set up and typecast incoming data
            const teams = data.teams as number[];
            const allTeamData = flatted.parse(data.allTeamData) as Partial<Record<Metric, { average: number, teamAverages: Record<number, number>, std: number }>>;
            const flags = data.flags as string[];
            const queries = flatted.parse(data.queries) as Record<string, number>;
            const tournamentKey = data.tournamentKey as string;

            const finalData: WorkerResponseData = [];

            for (const team of teams) {
                const adj: { type: string, result: number }[] = [];
                const unAdj: typeof adj = [];
                const flagData: typeof adj = [];

                for (const [picklistParam, metric] of Object.entries(picklistToMetric)) {
                    if (queries[picklistParam]) {
                        let currAvg = allTeamData[metric].teamAverages[team];
                        let zScore = 0;

                        // If there is a meaningful datapoint, calculate zScore
                        if (currAvg !== 0) {
                            // Default standard deviation to 0.1
                            zScore = (currAvg - allTeamData[metric].average) / (allTeamData[metric].std || 0.1);
                        }

                        adj.push({ type: picklistParam, result: zScore * queries[metric] });
                        unAdj.push({ type: picklistParam, result: zScore });
                    }

                    if (flags.includes(picklistParam)) {
                        // Push flagged metrics
                        let currAvg = allTeamData[metric].teamAverages[team];
                        flagData.push({ type: picklistParam, result: currAvg });
                    }
                }

                if (flags.includes("rank")) {
                    flagData.push({ type: "rank", result: await rankFlag("frc" + team, tournamentKey) })
                }


                const zScoreTotal = adj.reduce((acc, curr) => acc + curr.result, 0);
                finalData.push({
                    "team": team,
                    "zScore": zScoreTotal,
                    "adjusted": adj,
                    "unadjusted": unAdj,
                    "flags": flagData
                })
            }

            // Send data back to shell
            parentPort.postMessage(finalData);
        })
    })
}


catch (error) {
    console.log(error);
    throw error;
}

