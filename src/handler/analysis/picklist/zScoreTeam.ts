import { picklistSliders } from "../analysisConstants";
import { parentPort } from 'worker_threads';
import { rankFlag } from '../rankFlag';
import flatted from 'flatted';
import prismaClient from "../../../prismaClient";
import { unwatchFile } from "fs";
import { teamAverageFastTournament } from "../coreAnalysis/teamAverageFastTournament";


//worker for picklists
try {
    parentPort.on('message', async (data) => {
        return new Promise(async function (resolve) {
            const metricTeamAverages = data.metricTeamAverages
            const allTeamAvgSTD = data.allTeamAvgSTD
            const params = data.params
            const flags = data.flags
            const req = flatted.parse(data.req)
            const finalData = []
            for (const team of data.teams) {
                let adj = [];
                let unAdj = [];
                let flagData = [];
                let hasData = true
                let isFirst = true
                for (const metric of picklistSliders) {
                    if (params.data[metric]) {
                        let currData = metricTeamAverages[metric][team]
                        if (currData === undefined || isFirst && !currData) {
                            hasData = false
                        }
                        isFirst = false
                        let zScore = 0
                        if (hasData) {
                            zScore = (currData.average - allTeamAvgSTD[metric].allAvg) / allTeamAvgSTD[metric].arraySTD

                        }
                        else {
                            currData = { average: 0 }
                            zScore = 0
                        }
                        if (isNaN(zScore)) {
                            zScore = 0
                        }
                        adj.push({ "result": zScore * params.data[metric], "type": metric })
                        unAdj.push({ "result": zScore, "type": metric })
                        if (flags.includes(metric)) {
                            if (!hasData) {
                                flagData.push({ type: metric, result: 0 })
                            }
                            else {
                                flagData.push({ type: metric, result: currData.average })
                            }
                        }
                    }


                }
                if (flags.includes("rank") && req.query.tournamentKey) {
                    if (req.query.tournamentKey) {
                        flagData.push({ type: "rank", result: await rankFlag(req, "frc" + team, req.query.tournamentKey as string) })
                    }
                    else {
                        let tourament = await prismaClient.tournament.findFirst({
                            where:
                            {
                                teamMatchData:
                                {
                                    some:
                                    {
                                        teamNumber: params.data.team
                                    }
                                }
                            },
                            orderBy:
                            {
                                date: "desc"
                            }
                        })
                        flagData.push({ type: "rank", result: await rankFlag(req, "frc" + team, tourament.key) })

                    }


                }
                let zScoreTotal = adj.reduce((partialSum, a) => partialSum + a.result, 0);
                finalData.push({
                    "team": team,
                    "zScore": zScoreTotal,
                    "adjusted": adj,
                    "unadjusted": unAdj,
                    "flags": flagData
                })
            }
            parentPort.postMessage(finalData);

        })

    })

}
catch (error) {
    console.log(error);
    throw error;
}

