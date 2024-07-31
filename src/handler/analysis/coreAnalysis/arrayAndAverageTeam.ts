import { Request, Response } from "express";
import prismaClient from '../../../prismaClient'
import z, { date } from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { singleMatchEventsAverage } from "./singleMatchEventsAverage";
import { autoEnd, matchTimeEnd, multiplerBaseAnalysis, swrConstant, teamLowerBound, teleopStart, ttlConstant } from "../analysisConstants";
import { run } from "node:test";
import { stagePicklistTeam } from "../picklist/stagePicklistTeam";
import { match } from "assert";
import { User } from "@prisma/client";


export const arrayAndAverageTeam = async (user: User, metric: string, team: number): Promise<{ average: number, timeLine: Array<{ match: string, dataPoint: number }> }> => {
    try {
        const params = z.object({
            team: z.number(),
        }).safeParse({
            team: team,
        })
        if (!params.success) {
            throw (params)
        };
        let matchKeys = []
        if (user.tournamentSource.length >= teamLowerBound) {
            matchKeys = await prismaClient.teamMatchData.findMany({
                cacheStrategy :
                {
                    swr : swrConstant,
                    ttl : ttlConstant,
                },
                where: {
                    teamNumber: team,
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
        }
        else
        {
            matchKeys = await prismaClient.teamMatchData.findMany({
                cacheStrategy :
                {
                    swr : swrConstant,
                    ttl : ttlConstant,
                },
                where: {
                    
                    teamNumber: team,
                    scoutReports:
                    {
                        some: {}
                    },
                    tournamentKey :
                    {
                        in : user.tournamentSource
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
        }
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
            const matchMap = { key: match.key, tournamentKey: match.tournamentKey, matchNumber: match.matchNumber, teamNumber: match.teamNumber, matchType: match.matchType, tournamentName: match.tournament.name }
            acc[match.tournamentKey].push(matchMap);
            return acc;
        }, {});
        const tournamentGroups: Match[][] = Object.values(groupedByTournament);
        if (metric === "stage") {
            return { average: await stagePicklistTeam(user, team), timeLine: null }
        }
        const timeLineArray = []
        const tournamentAverages = []
        //group into tournaments, calculate all averages indivudally so they can all be properly weighted after the nested loops
        for (const tournament of tournamentGroups) {
            let currAvg = null
            const currDatas = []
            for (const match of tournament) {
                //add time constraints if nessissary

                if (metric.includes("teleop") || metric.includes("Teleop")) {
                    const currData = singleMatchEventsAverage(user, metric.includes("point") || metric.includes("Point"), match.key, team, metric, teleopStart, matchTimeEnd)
                    currDatas.push(currData)
                }
                else if (metric.includes("auto") || metric.includes("Auto")) {
                    const currData = singleMatchEventsAverage(user, metric.includes("point") || metric.includes("Point"), match.key, team, metric, 0, autoEnd)
                    currDatas.push(currData)

                }
                else {
                    const currData = singleMatchEventsAverage(user, metric.includes("point") || metric.includes("Point"), match.key, team, metric)
                    currDatas.push(currData)
                }

            }
            await Promise.all(currDatas).then((values) => {
                let sum = 0;
                let count = 0;
                for (let i = 0; i < values.length; i++) {
                    if (values[i] !== null) {
                        sum += values[i];
                        count++;
                        timeLineArray.push({ match: tournament[i].key, dataPoint: values[i], tournamentName: tournament[i].tournamentName });
                    }
                }

                currAvg = count > 0 ? sum / count : null;
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


        return {
            average: runningAverage,
            timeLine: timeLineArray
        }

    }
    catch (error) {
        console.error(error)
        throw (error)
    }

};