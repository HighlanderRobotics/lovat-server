import prismaClient from '../../../prismaClient'
import z from 'zod'
import { autoEnd, matchTimeEnd, swrConstant, teleopStart, tournamentLowerBound, ttlConstant } from "../analysisConstants";
import { stagePicklistTeam } from "../picklist/stagePicklistTeam";
import { teamAverageFastTournament } from "./teamAverageFastTournament";
import { User } from "@prisma/client";


export const arrayAndAverageTeamFast = async (user: User, metric: string, team: number): Promise<{ average: number }> => {
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
        if (user.tournamentSource.length >= tournamentLowerBound) {
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
        else {
            
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
                    tournamentKey:
                    {
                        in: user.tournamentSource
                    },
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
            return { average: await stagePicklistTeam(user, team) }
        }
        const tournamentAverages = []
        //group into tournaments, calculate all averages indivudally so they can all be properly weighted after the nested loops
        for (const tournamentMatchRows of tournamentGroups) {
            const currAvg = null
            if (metric.includes("teleop") || metric.includes("Teleop")) {
                const currData = await teamAverageFastTournament(user, team, metric.includes("point") || metric.includes("Point"), metric, tournamentMatchRows[0].tournamentKey, teleopStart, matchTimeEnd)
                tournamentAverages.push(currData)
            }
            else if (metric.includes("auto") || metric.includes("Auto")) {
                const currData = await teamAverageFastTournament(user, team, metric.includes("point") || metric.includes("Point"), metric, tournamentMatchRows[0].tournamentKey, 0, autoEnd)
                tournamentAverages.push(currData)

            }
            else {
                const currData = await teamAverageFastTournament(user, team, metric.includes("point") || metric.includes("Point"), metric, tournamentMatchRows[0].tournamentKey)
                tournamentAverages.push(currData)
            }

        }

        let runningAverage = 0

        for (let i = 0; i < tournamentAverages.length; i++) {
            if (i === 0) {
                runningAverage = tournamentAverages[i]
            }
            // else if (i === tournamentAverages.length - 1) {
            //     const recentTournament = matchKeys[matchKeys.length - 1].tournamentKey
            //     const scoutedMatchesAtMostRecentTournament = timeLineArray.filter(item => item.match.startsWith(recentTournament)).length;
            //     const totalMatchesAtMostRecentTournament = tournamentGroups[i].length
            //     //0.95 because thats were it asymmpotes, not where it will realsitically reach. Graph on desmos to see more info
            //     const weightOnRecent = 0.95 * (1 - (1 / ((multiplerBaseAnalysis * scoutedMatchesAtMostRecentTournament / totalMatchesAtMostRecentTournament) + 1)))
            //     runningAverage = runningAverage * (1 - weightOnRecent) + tournamentAverages[i] * weightOnRecent
            // }
            else {
                runningAverage = runningAverage * 0.2 + tournamentAverages[i] * 0.8
            }
        }

        return {
            average: runningAverage,
        }

    }
    catch (error) {
        console.error(error)
        throw (error)
    }

};