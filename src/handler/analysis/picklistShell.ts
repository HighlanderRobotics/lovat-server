

// constructor(db, tourmentKey, coneOneScore, coneTwoScore, coneThreeScore, cubeOneScore, cubeTwoScore, cubeThreeScore, autoCargo, teleOp, defense, autoClimb, feedCone, feedCube, avgTotal, teleppClimb, driverAbility, flags) {
//     super(db)
//     this.tourmentKey = tourmentKey
//     this.cubeOneScore = cubeOneScore
//     this.cubeTwoScore = cubeTwoScore
//     this.cubeThreeScore = cubeThreeScore
//     this.autoCargo = autoCargo
//     this.teleOp = teleOp
//     this.result = []
//     this.coneOneScore = coneOneScore
//     this.coneTwoScore = coneTwoScore
//     this.coneThreeScore = coneThreeScore
//     this.defense = defense
//     this.autoClimb = autoClimb
//     this.feedingCone = feedCone
//     this.feedingCube = feedCube
//     this.avgTotal = avgTotal
//     this.teleppClimb = teleppClimb
//     this.driverAbility = driverAbility
//     this.flag = flags
// }

import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";
import { arrayAndAverageAllTeam } from "./arrayAndAverageAllTeams";
import ss from 'simple-statistics';
import prisma from '../../prismaClient';
import z from 'zod'
import { all } from "axios";
import { zScoreTeam } from "./zScoreTeam";
import { match } from "assert";
import { addTournamentMatches } from "../manager/addTournamentMatches";




export const nonEventMetric = async (req: AuthenticatedRequest, res: Response) => {
    //if theres a tournamentKey provided only look at teams from that tournament, else, look at all teams
    const params = z.object({
        tournamentKey: z.string().nullable(),
        totalPoints: z.number(),
        autoPoints: z.number(),
        teleopPoints: z.number(),
        driverAbility: z.number(),
        defense: z.number()

    }).safeParse({
        tournnamentKey: req.query.tournamentKey,
        totalPoints: req.query.totalPoints,
        autoPoints: req.query.autoPoints,
        teleopPoints: req.query.teleopPoints,
        driverAbility: req.query.driverAbility,
        defense: req.query.defense

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
    const sliderOptions = ["put", "slider/metric", "names", "here"]
    const allTeamAvgSTD = {}
        sliderOptions.forEach(async element => {
            //under the ssumption that all sliderOPtions will be valid metrics in the arrayAndAverageAllTeam
            const currData = await arrayAndAverageAllTeam(req, element)
            allTeamAvgSTD[element] = { "allAvg": currData.average, "arraySTD": ss.standardDeviation(currData.timeLine) }
        });
    const allTeams = await prismaClient.team.findMany({})
    let includedTeamNumbers: number[] = allTeams.map(team => team.number);
    if (params.data.tournamentKey !== null) {
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
    includedTeamNumbers.forEach(async element => {
        const currZscores = await zScoreTeam(req, allTeamAvgSTD)
        //flags go here, wehn added
        if (!isNaN(currZscores.zScore)) {
            let temp = { "team": element, "result": currZscores.zScore, "breakdown": currZscores.adjusted, "unweighted": currZscores.unadjusted}
            arr.push(temp)
        }
    });
    const resultArr = arr.sort((a, b) => b.result - a.result)
    res.status(400).send(resultArr)



}






