import prismaClient from '../../../prismaClient'
import {
  autoEnd,
  matchTimeEnd,
  swrConstant,
  tournamentLowerBound,
  ttlConstant,
} from "../analysisConstants";
import { bargePicklistTeam } from "../picklist/bargePicklistTeam";
import { Metric } from "../analysisConstants";
import { User } from "@prisma/client";
import z from 'zod'
import { teamAverageFastTournament } from './teamAverageFastTournament'

/**
 * Performance optimized heuristic for finding the average value of a metric for a team.
 * More recent tournaments weighted more heavily.
 * 
 * @param user user requesting
 * @param metric metric to average
 * @param team team to check
 * @returns object with average property
 */
export const arrayAndAverageTeamFast = async (user: User, metric: Metric, team: number): Promise<{ average: number }> => {
    try {
        const params = z.object({
            team: z.number(),
        }).safeParse({ team });
        if (!params.success) {
            throw params;
        };

        if (metric === Metric.bargePoints) {
            return { average: await bargePicklistTeam(user, team) }
        }

        let matchKeys = [];
        if (user.tournamentSource.length >= tournamentLowerBound) {
            matchKeys = await prismaClient.teamMatchData.findMany({
                cacheStrategy: {
                    swr: swrConstant,
                    ttl: ttlConstant,
                },
                where: {
                    teamNumber: team,
                    scoutReports: { some: {} }
                },
                include: { tournament: true },
                orderBy: [
                    { tournament: { date: "asc" } },
                    { matchType: "asc" },
                    { matchNumber: "asc" },
                ]
            });
        } else {
            matchKeys = await prismaClient.teamMatchData.findMany({
                cacheStrategy: {
                    swr: swrConstant,
                    ttl: ttlConstant,
                },
                where: {
                    teamNumber: team,
                    scoutReports: { some: {} },
                    tournamentKey: { in: user.tournamentSource }
                },
                include: { tournament: true },
                orderBy: [
                    { tournament: { date: "asc" } },
                    { matchType: "asc" },
                    { matchNumber: "asc" },
                ]
            });
        }

        interface Match {
            key: string;
            tournamentKey: string;
            matchNumber: number;
            teamNumber: number;
            matchType: string;
            tournamentName: string;
        }

        const groupedByTournament = matchKeys.reduce<Record<string, Match[]>>((acc, match) => {
            acc[match.tournamentKey] = acc[match.tournamentKey] || [];
            const matchMap: Match = {
                key: match.key,
                tournamentKey: match.tournamentKey,
                matchNumber: match.matchNumber,
                teamNumber: match.teamNumber,
                matchType: match.matchType,
                tournamentName: match.tournament.name
            };
            acc[match.tournamentKey].push(matchMap);
            return acc;
        }, {});
        const tournamentGroups: Match[][] = Object.values(groupedByTournament);

        const tournamentAverages: number[] = [];
        for (const tournamentMatchRows of tournamentGroups) {
            if (metric === Metric.teleopPoints) {
                const currData = await teamAverageFastTournament(user, team, true, Metric.teleopPoints, tournamentMatchRows[0].tournamentKey, autoEnd, matchTimeEnd);
                tournamentAverages.push(currData);
            } else if (metric === Metric.autoPoints) {
                const currData = await teamAverageFastTournament(user, team, true, Metric.autoPoints, tournamentMatchRows[0].tournamentKey, 0, autoEnd);
                tournamentAverages.push(currData);
            } else {
                const currData = await teamAverageFastTournament(user, team, metric === Metric.totalPoints, metric, tournamentMatchRows[0].tournamentKey);
                tournamentAverages.push(currData);
            }
        }

        let runningAverage = 0;
        for (let i = 0; i < tournamentAverages.length; i++) {
            if (i === 0) {
                runningAverage = tournamentAverages[i];
            // } else if (i === tournamentAverages.length - 1) {
            //     const recentTournamentKey = matchKeys[matchKeys.length - 1].tournamentKey;
            //     const recentTournamentMatches = matchKeys.filter(match => match.tournamentKey === recentTournamentKey);
            //     const scoutedMatchesAtMostRecentTournament = recentTournamentMatches.length;
            //     const totalMatchesAtMostRecentTournament = tournamentGroups[i].length;
            //     const weightOnRecent = 0.95 * (1 - (1 / ((multiplerBaseAnalysis * (scoutedMatchesAtMostRecentTournament / totalMatchesAtMostRecentTournament)) + 1)));
            //     runningAverage = runningAverage * (1 - weightOnRecent) + tournamentAverages[i] * weightOnRecent;
            } else {
                runningAverage = runningAverage * 0.2 + tournamentAverages[i] * 0.8;
            }
        }

        return { average: runningAverage };

    } catch (error) {
        console.error(error);
        throw error;
    }
};
