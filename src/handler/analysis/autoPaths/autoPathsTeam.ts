import { Request, Response } from "express";
import prismaClient from '../../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { autoPathSingleMatchSingleScouter } from "./autoPathSingleMatchSingleScouter";


export const autoPathsTeam = async (req: AuthenticatedRequest, teamNumber : number) => {
    try {
        const params = z.object({
            team: z.number(),
        }).safeParse({
            team: teamNumber
        })
        if (!params.success) {
            throw(params)
        };

        type Position = {
            location: number;
            event: number;
            time?: number;
        };
        
        type AutoData = {
            autoPoints: number;
            positions: Position[];
            match: string;
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

        const groupAutoData = (data: AutoData[]): { positions: Position[], matches: string[], score: number[], frequency: number, maxScore: number }[] => {
            const groups: { positions: Position[], matches: Set<string>, score: number[], maxScore: number }[] = [];
        
            data.forEach(item => {
                let isGrouped = false;
        
                for (const group of groups) {
                    if (isSubsetPositions(item.positions, group.positions)) {
                        if (item.positions.length > group.positions.length) {
                            group.positions = item.positions; 
                        }
                        group.matches.add(item.match);
                        group.score.push(item.autoPoints);
                        group.maxScore = Math.max(group.maxScore, item.autoPoints); 
                        isGrouped = true;
                        break;
                    }
                }
        
                if (!isGrouped) {
                    groups.push({ positions: item.positions, matches: new Set([item.match]), score: [item.autoPoints], maxScore: item.autoPoints });
                }
            });
        
            return groups.map(group => ({
                positions: group.positions,
                matches: Array.from(group.matches), 
                score: group.score,
                frequency: group.matches.size,
                maxScore: group.maxScore 
            }));
        };

        const matches = await prismaClient.scoutReport.findMany({
            where : {
                teamMatchData : 
                {
                    teamNumber : params.data.team
                }
            }
        })
        let autoPaths  = []
        for(const element of matches)
        {
            const currAutoPath = await autoPathSingleMatchSingleScouter(req, element.teamMatchKey, element.scouterUuid)
            if(currAutoPath)
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
