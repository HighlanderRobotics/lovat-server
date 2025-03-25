import prismaClient from '../../../prismaClient'
import z from 'zod'
import { autoPathSingleMatchSingleScoutReport } from "./autoPathSingleMatchSingleScoutReport";
import { User } from "@prisma/client";
import { Position, AutoData } from './autoPathSingleMatchSingleScoutReport';

export const autoPathsTeam = async (user: User, teamNumber : number) => {
    try {
        const params = z.object({
            team: z.number(),
        }).safeParse({
            team: teamNumber
        })
        if (!params.success) {
            throw(params)
        };

        const isSubsetPositions = (listOne: Position[], listTwo: Position[]): boolean => {
            const isSubset = (a: Position[], b: Position[]): boolean => 
                a.every(posA => 
                    b.some(posB => 
                        posA.location === posB.location && posA.event === posB.event
                    )
                );
        
            return isSubset(listOne, listTwo) || isSubset(listTwo, listOne);
        };
        const groupAutoData = (data: AutoData[]): { positions: Position[], matches: { matchKey: string, tournamentName: string }[], score: number[], frequency: number, maxScore: number }[] => {
            const groups: { positions: Position[], matches: Set<string>, score: number[], maxScore: number, matchDetails: Map<string, string> }[] = [];
        
            data.forEach(item => {
                let isGrouped = false;
        
                for (const group of groups) {
                    if (isSubsetPositions(item.positions, group.positions)) {
                        if (item.positions.length > group.positions.length) {
                            group.positions = item.positions;
                        }
                        group.matches.add(item.match);
                        group.matchDetails.set(item.match, item.tournamentName);
                        group.score.push(item.score); 
                        group.maxScore = Math.max(group.maxScore, item.score);
                        isGrouped = true;
                        break;
                    }
                }
        
                if (!isGrouped) {
                    const matchDetails = new Map<string, string>();
                    matchDetails.set(item.match, item.tournamentName);
                    groups.push({
                        positions: item.positions,
                        matches: new Set([item.match]),
                        score: [item.score], 
                        maxScore: item.score,
                        matchDetails: matchDetails
                    });
                }
            });
        
            return groups.map(group => ({
                positions: group.positions,
                matches: Array.from(group.matches).map(matchKey => ({ matchKey: matchKey, tournamentName: group.matchDetails.get(matchKey) || '' })),
                score: group.score,
                frequency: group.matches.size,
                maxScore: group.maxScore
            }));
        };
        
        const matches = await prismaClient.scoutReport.findMany({
            where : {
                teamMatchData : 
                {
                    teamNumber : params.data.team,
                    tournamentKey :
                    {
                        in : user.tournamentSource
                    },
                    
                },
                scouter :
                {
                    sourceTeamNumber :
                    {
                        in : user.teamSource
                    }
                }
            },
            orderBy: {
                teamMatchData: {
                    tournament: {
                        date: 'desc'
                    },
                    matchType: "desc",
                    matchNumber: 'desc'
                }
            }
        })
        const autoPaths: AutoData[] = []
        for(const element of matches)
        {
            const currAutoPath = await autoPathSingleMatchSingleScoutReport(user, element.teamMatchKey, element.uuid)
            if(currAutoPath.positions.length > 0)
            {
                autoPaths.push(currAutoPath)
            }
        }
        const groupedAutoPaths = groupAutoData(autoPaths)
        
        return groupedAutoPaths
    }
    catch (error) {
        console.error(error)
        throw(error)
    }
};


