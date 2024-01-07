
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
import { allMetrics } from "../analysisConstants";




export const nonEventMetric = async (req: AuthenticatedRequest, res: Response) => {
    //if theres a tournamentKey provided only look at teams from that tournament, else, look at all teams
    const params = z.object({
        tournamentKey: z.string().nullable(),
        totalPoints: z.number(),
        pickUps : z.number(),
        stage : z.number(),
        highNote : z.number(),
        trapScore : z.number(),
        autoPoints: z.number(),
        teleopPoints: z.number(),
        driverAbility: z.number(),
        defense: z.number(),
        speakerScores : z.number(),
        ampScores : z.number(),
        cooperation : z.number()


    }).safeParse({
        tournnamentKey: Number(req.query.tournamentKey),
        totalPoints: Number(req.query.totalPoints),
        pickUps :  Number(req.query.pickUps),
        stage :  Number(req.query.stage),
        highNote :  Number(req.query.highNote),
        trapScore :  Number(req.query.trap),
        autoPoints: Number(req.query.autoPoints),
        teleopPoints: Number(req.query.teleopPoints),
        driverAbility: Number(req.query.driverAbility),
        defense: Number(req.query.defense),
        speakerScores :  Number(req.query.speakerScores),
        ampScores :  Number(req.query.totalPoints),
        cooperation :  Number(req.query.cooperation),

    })
    if (!params.success) {
        res.status(400).send(params);
        return;
    };
    //if tournament matches not in yet, attempt to add them
    const matches = await prismaClient.teamMatchData.findMany({
        where :
        {
            tournamentKey : params.data.tournamentKey
        }
    })
    if(matches === null || match.length === 0)
    {
        await addTournamentMatches(params.data.tournamentKey)
    }
    const allTeamAvgSTD = {}
    for (const element of allMetrics) {
        const currData = await arrayAndAverageAllTeam(req, element);
        allTeamAvgSTD[element] = { 
            "allAvg": currData.average, 
            "arraySTD": ss.standardDeviation(currData.timeLine) 
        };
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
        const currZscores = await zScoreTeam(req, allTeamAvgSTD)
        //flags go here, wehn added
        if (!isNaN(currZscores.zScore)) {
            let temp = { "team": element, "result": currZscores.zScore, "breakdown": currZscores.adjusted, "unweighted": currZscores.unadjusted}
            arr.push(temp)
        }
    };
    const resultArr = arr.sort((a, b) => b.result - a.result)
    res.status(400).send(resultArr)



}






