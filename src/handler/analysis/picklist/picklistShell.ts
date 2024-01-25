
import { Request, Response } from "express";
import prismaClient from '../../../prismaClient'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { arrayAndAverageAllTeam } from "../coreAnalysis/arrayAndAverageAllTeams";
import ss from 'simple-statistics';
import prisma from '../../../prismaClient';
import z from 'zod'
import { all } from "axios";
import { zScoreTeam } from "./zScoreTeam";
import { match } from "assert";
import { addTournamentMatches } from "../../manager/addTournamentMatches";
import { picklistSliders } from "../analysisConstants";




export const picklistShell = async (req: AuthenticatedRequest, res: Response) => {
    try {

            const params = z.object({
            tournamentKey: z.string().optional(),
            totalPoints: z.number(),
            pickUps: z.number(),
            stage: z.number(),
            trapScores: z.number(),
            autoPoints: z.number(),
            teleopPoints: z.number(),
            driverAbility: z.number(),
            defense: z.number(),
            speakerScores: z.number(),
            ampScores: z.number(),
            cooperation: z.number(),
            feeds: z.number()


        }).safeParse({
            tournamentKey: req.query.tournamentKey,
            totalPoints: Number(req.query.totalPoints),
            pickUps: Number(req.query.pickUps),
            stage: Number(req.query.stage),
            trapScores: Number(req.query.trapScores),
            autoPoints: Number(req.query.autoPoints),
            teleopPoints: Number(req.query.teleopPoints),
            driverAbility: Number(req.query.driverAbility),
            defense: Number(req.query.defense),
            speakerScores: Number(req.query.speakerScores),
            ampScores: Number(req.query.totalPoints),
            cooperation: Number(req.query.cooperation),
            feeds: Number(req.query.feeds)

        })
        if (!params.success) {
            res.status(400).send(params);
            return;
        };
        //if tournament matches not in yet, attempt to add them
        const matches = await prismaClient.teamMatchData.findMany({
            where:
            {
                tournamentKey: params.data.tournamentKey
            }
        })
        if (matches === null || match.length === 0) {
            await addTournamentMatches(params.data.tournamentKey)
        }
        const allTeamAvgSTD = {}
        let data = true
         for (const element of picklistSliders) {
            const currData = await arrayAndAverageAllTeam(req, element);
            if (currData.average !== null && !isNaN(currData.average) && currData.average !== undefined) {
                allTeamAvgSTD[element] = {
                    "allAvg": currData.average,
                    "arraySTD": ss.standardDeviation(currData.timeLine)
                };
            }
            else
            {
                allTeamAvgSTD[element] = {
                    "allAvg": 0,
                    "arraySTD": 0
                };
            }

        }
        const allTeams = await prismaClient.team.findMany({})
        let includedTeamNumbers: number[] = allTeams.map(team => team.number);
        if (params.data.tournamentKey) {
            const teamsAtTournament = await prismaClient.teamMatchData.groupBy({
                by: ["teamNumber"],
                where:
                {
                    tournamentKey: params.data.tournamentKey
                }
            })
            includedTeamNumbers = teamsAtTournament.map(record => record.teamNumber);

        }
        
        let arr = []
        for (const element of includedTeamNumbers) {
            const currZscores = await zScoreTeam(req, allTeamAvgSTD, element, params)
            //flags go here, wehn added
            if (!isNaN(currZscores.zScore)) {
                let temp = { "team": element, "result": currZscores.zScore, "breakdown": currZscores.adjusted, "unweighted": currZscores.unadjusted }
                arr.push(temp)
            }
        };
        const resultArr = arr.sort((a, b) => b.result - a.result)
        res.status(200).send(resultArr)
    }
    catch (error) {
        console.log(error)
        res.status(400).send(error)
    }

}






