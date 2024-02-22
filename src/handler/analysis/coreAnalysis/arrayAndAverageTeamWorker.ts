import { Request, Response } from "express";
import prismaClient from '../../../prismaClient'
import z, { date } from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { singleMatchEventsAverage } from "./singleMatchEventsAverage";
import { autoEnd, matchTimeEnd, multiplerBaseAnalysis, teleopStart } from "../analysisConstants";
import { run } from "node:test";
import { stagePicklistTeam } from "../picklist/stagePicklistTeam";
import { match } from "assert";
import { parentPort } from "worker_threads";
import { deflateRawSync } from "zlib";


try {
    parentPort.on('message', async (data) => {
        let teamsDataArray = []
        for (const team of data.teams) {
            const params = z.object({
                team: z.number(),
            }).safeParse({
                team: data.team,
            })
            if (!params.success) {
                throw (params)
            };
            let metric = data.metric
            let matchKeys = await prismaClient.teamMatchData.findMany({
                where: {
                    tournamentKey:
                    {
                        in: data.req.user.tournamentSource
                    },
                    teamNumber: params.data.team,
                    scoutReports:
                    {
                        some: {}
                    }
                },
                include:
                {
                    tournament: true
                },
                orderBy:
                    [
                        {
                            tournament: {
                                date: "asc"
                            }
                        },
                        //aplhabetical with QUALIFICATION first, then ELIMINATION

                        { matchType: "asc" },
                        { matchNumber: "asc" },

                    ]
            })
            type Match = {
                key: string;
                tournamentKey: string;
                matchNumber: number;
                teamNumber: number;
                matchType: string;
                tournamentName: string
            };

            const groupedByTournament = matchKeys.reduce<Record<string, Match[]>>((acc, match) => {
                acc[match.tournamentKey] = acc[match.tournamentKey] || [];
                let matchMap = { key: match.key, tournamentKey: match.tournamentKey, matchNumber: match.matchNumber, teamNumber: match.teamNumber, matchType: match.matchType, tournamentName: match.tournament.name }
                acc[match.tournamentKey].push(matchMap);
                return acc;
            }, {});
            const tournamentGroups: Match[][] = Object.values(groupedByTournament);
            if (metric === "stage") {
                return { average: await stagePicklistTeam(data.req, params.data.team), timeLine: null }
            }
            const timeLineArray = []
            const tournamentAverages = []
            //group into tournaments, calculate all averages indivudally so they can all be properly weighted after the nested loops
            for (const tournament of tournamentGroups) {
                let currAvg = null
                const currDatas = []
                for (const match of tournament) {
                    //add time constraints if nessissary

                    if (data.includes("teleop") || metric.includes("Teleop")) {
                        let currData = singleMatchEventsAverage(data.req, metric.includes("point") || metric.includes("Point"), match.key, data.team, metric, teleopStart, matchTimeEnd)
                        currDatas.push(currData)
                    }
                    else if (metric.includes("auto") || metric.includes("Auto")) {
                        let currData = singleMatchEventsAverage(data.req, metric.includes("point") || metric.includes("Point"), match.key, data.team, metric, 0, autoEnd)
                        currDatas.push(currData)

                    }
                    else {
                        let currData = singleMatchEventsAverage(data.req, metric.includes("point") || metric.includes("Point"), match.key, params.data.team, metric)
                        currDatas.push(currData)
                    }

                }
                await Promise.all(currDatas).then((values) => {
                    for (let i = 0; i < values.length; i++) {
                        if (values[i] !== null) {
                            timeLineArray.push({ match: tournament[i].key, dataPoint: values[i], tournamentName: tournament[i].tournamentName })
                            if (currAvg === null) {
                                currAvg = values[i]
                            }
                            else {
                                currAvg = (currAvg + values[i]) / 2
                            }
                        }
                    }
                })
                if (currAvg !== null) {
                    tournamentAverages.push(currAvg)
                }
            };

            let runningAverage = 0
            for (let i = 0; i < tournamentAverages.length; i++) {
                if (i === 0) {
                    runningAverage = tournamentAverages[i]
                }
                else if (i === tournamentAverages.length - 1) {
                    const recentTournament = matchKeys[matchKeys.length - 1].tournamentKey
                    const scoutedMatchesAtMostRecentTournament = timeLineArray.filter(item => item.match.startsWith(recentTournament)).length;
                    const totalMatchesAtMostRecentTournament = tournamentGroups[i].length
                    //0.95 because thats were it asymmpotes, not where it will realsitically reach. Graph on desmos to see more info
                    const weightOnRecent = 0.95 * (1 - (1 / ((multiplerBaseAnalysis * scoutedMatchesAtMostRecentTournament / totalMatchesAtMostRecentTournament) + 1)))
                    runningAverage = runningAverage * (1 - weightOnRecent) + tournamentAverages[i] * weightOnRecent
                }
                else {
                    runningAverage = runningAverage * 0.2 + tournamentAverages[i] * 0.8
                }
            }


            teamsDataArray.push( {
                average: runningAverage,
                timeLine: timeLineArray,
                team : team
            })
        }
        return teamsDataArray
    })


}
catch (error) {
    console.error(error)
    throw (error)
}

