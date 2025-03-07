import prismaClient from '../../../prismaClient'
import z from 'zod'
import { autoEnd, matchTimeEnd, multiplerBaseAnalysis } from "../analysisConstants";
import { endgamePicklistTeamFast } from "../picklist/endgamePicklistTeamFast";
import { parentPort } from "worker_threads";
import { teamAverageFastTournament } from "./teamAverageFastTournament";
import flatted from 'flatted'

    parentPort.on('message', async (data) => {
        try {

        new Promise(async (resolve, reject) => {

            const teamsDataArray = []
            const req = flatted.parse(data.req)
            for (const team of data.teams) {
                const params = z.object({
                    team: z.number(),
                }).safeParse({
                    team: team,
                })
                if (!params.success) {
                    throw (params)
                };
                const metric = data.metric
                const matchKeys = await prismaClient.teamMatchData.findMany({
                    where: {
                        tournamentKey:
                        {
                            in: req.user.tournamentSource
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
                   orderBy :
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
                interface Match {
                    key: string;
                    tournamentKey: string;
                    matchNumber: number;
                    teamNumber: number;
                    matchType: string;
                    tournamentName: string
                }

                const groupedByTournament = matchKeys.reduce<Record<string, Match[]>>((acc, match) => {
                    acc[match.tournamentKey] = acc[match.tournamentKey] || [];
                    const matchMap = { key: match.key, tournamentKey: match.tournamentKey, matchNumber: match.matchNumber, teamNumber: match.teamNumber, matchType: match.matchType, tournamentName: match.tournament.name }
                    acc[match.tournamentKey].push(matchMap);
                    return acc;
                }, {});
                const tournamentGroups: Match[][] = Object.values(groupedByTournament);
                if (metric === "stage") {
                    return { average: await endgamePicklistTeamFast(req, params.data.team), timeLine: null }
                }
                const timeLineArray = []
                const tournamentAverages = []
                //group into tournaments, calculate all averages indivudally so they can all be properly weighted after the nested loops
                for (const tournament of tournamentGroups) {
                    let currAvg = null
                    const currDatas = []

                    if (metric.includes("teleop") || metric.includes("Teleop")) {
                        const currData = await teamAverageFastTournament(req, team, metric.includes("point") || metric.includes("Point"), metric, tournament[0].tournamentKey, autoEnd, matchTimeEnd)
                        currDatas.push(currData)
                    }
                    else if (metric.includes("auto") || metric.includes("Auto")) {
                        const currData = await teamAverageFastTournament(req, team, metric.includes("point") || metric.includes("Point"), metric, tournament[0].tournamentKey, 0, autoEnd)
                        currDatas.push(currData)

                    }
                    else {
                        const currData = teamAverageFastTournament(req, team, metric.includes("point") || metric.includes("Point"), metric, tournament[0].tournamentKey)
                        currDatas.push(currData)
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


                teamsDataArray.push({
                    average: runningAverage,
                    timeLine: timeLineArray,
                    team: team
                })
            }
            resolve(teamsDataArray)
        })
        

    }
    catch (error) {
        console.error(error)
        throw (error)
    }
})




