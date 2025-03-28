import prismaClient from '../../../prismaClient'
import { swrConstant, ttlConstant } from "../analysisConstants";
import { Prisma } from "@prisma/client";
import { weightedTourAvgLeft } from './arrayAndAverageTeams';

/**
 * Helper function for AAT to deal with driver ability
 *
 * @param teams
 * @param tmdFilter
 * @param srFilter
 * @returns
 */
export const arrayAndAverageDriverAbility = async (teams: number[], tmdFilter: Prisma.TeamMatchDataWhereInput, srFilter: Prisma.ScoutReportWhereInput): Promise<Record<number, { average: number, timeLine: { match: string, dataPoint: number }[] }>> => {
    const tmd = await prismaClient.teamMatchData.findMany({
        cacheStrategy: {
            swr: swrConstant,
            ttl: ttlConstant,
        },
        where: tmdFilter,
        select: {
            tournamentKey: true,
            key: true,
            teamNumber: true,
            scoutReports: {
                where: srFilter,
                select: {
                    driverAbility: true
                }
            },
        },
        orderBy: [
            // Ordered by oldest first
            {
                tournament: {
                    date: 'asc'
                }
            },
            { matchType: "asc" },
            { matchNumber: "asc" },
        ]
    });

    // Organized as team number => tournament => list of avg driver ability per match
    const matchGroups: Record<number, Array<{ match: string, dataPoint: number }[]>> = {};
    for (const team of teams) {
        matchGroups[team] = [];
    }

    // Group TMD by matches
    let currTournament = "";
    let tournamentIndex = -1;
    for (const curMatch of tmd) {
        if (curMatch.tournamentKey !== currTournament) {
            tournamentIndex++;
            matchGroups[curMatch.teamNumber][tournamentIndex] = [];
        }

        const matchAvg = curMatch.scoutReports.reduce((acc, cur) => acc + cur.driverAbility, 0) / curMatch.scoutReports.length;
        matchGroups[curMatch.teamNumber][tournamentIndex].push({ match: curMatch.key, dataPoint: matchAvg });
    }

    // Push timelines and aggregate final result
    const result: Record<number, { average: number, timeLine: { match: string, dataPoint: number }[] }> = {};
    for (const team of teams) {
        result[team] = { average: null, timeLine: [] };
        const tournamentGroups = [];

        // Push timeliens and aggregate by tournament
        matchGroups[team].forEach(tournament =>{
            result[team].timeLine.push(...tournament);
            tournamentGroups.push(tournament.reduce((acc, cur) => acc + cur.dataPoint, 0) / tournament.length);
        });

        // Weighted average for final result
        result[team].average = weightedTourAvgLeft(tournamentGroups);
    }

    return result;
}