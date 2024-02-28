import { Request, Response } from "express";
import prismaClient from '../../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { singleMatchEventsAverage } from "./singleMatchEventsAverage";
import { arrayAndAverageTeam } from "./arrayAndAverageTeam";
import { match } from "assert";
import prisma from "../../../prismaClient";


export const cooperationSingleMatch = async (req: AuthenticatedRequest, matchKey: string, team: number): Promise<number> => {
    try {
        const params = z.object({
            team: z.number(),
            matchKey: z.string()
        }).safeParse({
            team: team,
            matchKey: matchKey
        })
        if (!params.success) {
            throw (params)
        };
        const matchRow = await prismaClient.teamMatchData.findUnique({
            where:
            {
                key: matchKey
            }
        })
        if (!matchRow) {
            throw ("Match does not exist")
        }
        const allTeamsRows = await prismaClient.teamMatchData.findMany({
            where:
            {
                tournamentKey: matchRow.tournamentKey,
                matchNumber: matchRow.matchNumber,
                matchType: matchRow.matchType
            }
        })
        //ex: 2023gal_qm1_0, teamPositionSuffix would be 0
        const teamPositionSuffix = matchKey.charAt(matchKey.length - 1)
        //should have two entries (for teams on their alliance in the match)
        let arrOfDifferences : Array<number> = []
        if (teamPositionSuffix === "0" || teamPositionSuffix === "1" || teamPositionSuffix === "2") {
            //red alliance
            for (let i = 0; i < 3; i++) {
                const teamNumber = allTeamsRows[i].teamNumber
                if (i.toString() != teamPositionSuffix) {
                    const currDifference = await getDifferenceOneTeam(req, matchKey, teamNumber)
                    if(currDifference !== null)
                    {
                        arrOfDifferences.push(currDifference)
                    }
                }
            }
        }
        else {
            //blue alliance
            for (let i = 3; i < 6; i++) {
                const teamNumber = allTeamsRows[i].teamNumber
                if (i.toString() != teamPositionSuffix) {
                    const currDifference = await getDifferenceOneTeam(req, matchKey, teamNumber)
                    if(currDifference !== null)
                    {
                        arrOfDifferences.push(currDifference)
                    }
                }
            }
        }
        if(arrOfDifferences.length === 0)
        {
            return 0
        }
        return  arrOfDifferences.reduce((sum, curr) => sum + curr, 0)/arrOfDifferences.length


    }
    catch (error) {
        console.error(error)
        throw (error)
    }

};
async function getDifferenceOneTeam(req : AuthenticatedRequest, matchKey: string, teamNumber: number) {
    const averageTotalTeamPoints = (await arrayAndAverageTeam(req, "totalpoints", teamNumber)).average
    const teamPointsInThisMatch = await (await singleMatchEventsAverage(req, true, matchKey, teamNumber, "totalPoints"))
    if (teamPointsInThisMatch !== null) {
        return teamPointsInThisMatch - averageTotalTeamPoints
    }
    else
    {
        return null
    }
}