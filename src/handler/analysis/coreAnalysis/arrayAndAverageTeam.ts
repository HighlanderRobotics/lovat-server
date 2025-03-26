import prismaClient from '../../../prismaClient'
import { singleMatchEventsAverage } from "./singleMatchEventsAverage";
import { allTeamNumbers, allTournaments, autoEnd, matchTimeEnd, Metric, multiplerBaseAnalysis, swrConstant, tournamentLowerBound, ttlConstant } from "../analysisConstants";
import { endgamePicklistTeamFast } from "../picklist/endgamePicklistTeamFast";
import { User } from "@prisma/client";
import { getSourceFilter } from './arrayAndAverageManyFast';


export const arrayAndAverageTeam = async (user: User, metric: Metric, team: number): Promise<{ average: number, timeLine: { match: string, dataPoint: number }[] }> => {
    try {
        if (metric === Metric.bargePoints) {
            return { average: await endgamePicklistTeamFast(team, user), timeLine: null }
        }

        let tournamentFilter: {in?: string[]} = {}
        if (user.tournamentSource.length < tournamentLowerBound) {
            tournamentFilter = {in: user.tournamentSource}
        }

        const matchKeys = await prismaClient.teamMatchData.findMany({
            cacheStrategy:
            {
                swr: swrConstant,
                ttl: ttlConstant,
            },
            where: {
                teamNumber: team,
                scoutReports:
                {
                    some: {}
                },
                tournamentKey: tournamentFilter
            },
            include: {
                tournament: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy:
                [
                    {
                        tournament: {
                            date: "asc"
                        }
                    },
                    //alphabetical with QUALIFICATION first, then ELIMINATION
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

        // Group team-match data by tournament
        const groupedByTournament = matchKeys.reduce<Record<string, Match[]>>((acc, match) => {
            acc[match.tournamentKey] = acc[match.tournamentKey] || [];
            const matchMap = { key: match.key, tournamentKey: match.tournamentKey, matchNumber: match.matchNumber, teamNumber: match.teamNumber, matchType: match.matchType, tournamentName: match.tournament.name }
            acc[match.tournamentKey].push(matchMap);
            return acc;
        }, {});
        const tournamentGroups: Match[][] = Object.values(groupedByTournament);
        // if (metric === Metric.bargePoints) {
        //     return { average: await bargePicklistTeam(user, team), timeLine: null }
        // }
        const timeLineArray = []
        const tournamentAverages = []
        // Group into tournaments, calculate all averages individually so they can all be properly weighted after the nested loops
        for (const tournament of tournamentGroups) {
            let currAvg = null
            const currDatas: Promise<number>[] = []

            // IMO needs a refactor to take scout reports in with initial query
            for (const match of tournament) {
                // Add time constraints if necessary
                if (metric === Metric.teleopPoints) {
                    const currData = singleMatchEventsAverage(user, true, match.key, team, metric, autoEnd, matchTimeEnd)
                    currDatas.push(currData)
                }
                else if (metric === Metric.autoPoints) {
                    const currData = singleMatchEventsAverage(user, true, match.key, team, metric, 0, autoEnd)
                    currDatas.push(currData)
                }
                else {
                    const currData = singleMatchEventsAverage(user, metric === Metric.totalPoints, match.key, team, metric)
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