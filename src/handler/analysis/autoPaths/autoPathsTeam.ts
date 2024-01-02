import { Request, Response } from "express";
import prismaClient from '../../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { arrayAndAverageTeam } from "../coreAnalysis/arrayAndAverageTeam";
import { arrayAndAverageAllTeam } from "../coreAnalysis/arrayAndAverageAllTeams";
import { autoPathSingleMatchSingleScouter } from "./autoPathSingleMatchSingleScouter";


export const autoPathsTeam = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const params = z.object({
            team: z.number(),
        }).safeParse({
            team: Number(req.params.team),
        })
        if (!params.success) {
            res.status(400).send(params);
            return;
        };

        
        type Position = {
            location: string;
            event: string;
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
        //if one is a subset of the other, group them together and take the longer one as the full positions array
        const groupAutoData = (data: AutoData[]): { positions: Position[], matches: string[], score: number[], frequency: number }[] => {
            const groups: { positions: Position[], matches: Set<string>, score: number[] }[] = [];
        
            data.forEach(item => {
                let isGrouped = false;
        
                for (const group of groups) {
                    if (isSubsetPositions(item.positions, group.positions)) {
                        if (item.positions.length > group.positions.length) {
                            group.positions = item.positions; // Replace with the longer array
                        }
                        group.matches.add(item.match);
                        group.score.push(item.autoPoints);
                        isGrouped = true;
                        break;
                    }
                }
        
                if (!isGrouped) {
                    groups.push({ positions: item.positions, matches: new Set([item.match]), score: [item.autoPoints] });
                }
            });
        
            //putting it in the final format
            return groups.map(group => ({
                positions: group.positions,
                matches: Array.from(group.matches), 
                score: group.score,
                frequency: group.matches.size 
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
        res.status(200).send(groupedAutoPaths)
            }
    catch (error) {
        console.error(error)
        res.status(400).send(error)
    }

};