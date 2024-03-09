import { Request, Response } from "express";
import prismaClient from '../../../prismaClient'
import z, { number } from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { singleMatchEventsAverage } from "../coreAnalysis/singleMatchEventsAverage";
import { arrayAndAverageTeam } from "../coreAnalysis/arrayAndAverageTeam";
import { robotRole } from "../coreAnalysis/robotRole";
import { autoPathsTeam } from "../autoPaths/autoPathsTeam";
import { User } from "@prisma/client";


export const alliancePage = async (user : User, team1 : number, team2 : number, team3 : number): Promise<{totalPoints : number, teams : Array<Object>, speakerScores : number, ampScores : number}> =>{
    try {
        let teamOnePoints = await arrayAndAverageTeam(user, "totalpoints", team1)    
        let teamTwoPoints = await arrayAndAverageTeam(user, "totalpoints", team2)
        let teamThreePoints = await arrayAndAverageTeam(user, "totalpoints", team3)

        let teamOneMainRole = (await robotRole(user, team1)).mainRole
        let teamTwoMainRole = (await robotRole(user, team2)).mainRole
        let teamThreeMainRole = (await robotRole(user, team3)).mainRole

        let teamOneSpeakerScores = await arrayAndAverageTeam(user, "speakerscores", team1)
        let teamTwoSpeakerScores = await arrayAndAverageTeam(user, "speakerscores", team2)
        let teamThreeSpeakerScores = await arrayAndAverageTeam(user, "speakerscores", team3)


        let teamOneAmpScores = await arrayAndAverageTeam(user, "ampscores", team1)
        let teamTwoAmpScores = await arrayAndAverageTeam(user, "ampscores", team2)
        let teamThreeAmpScores = await arrayAndAverageTeam(user, "ampscores", team3)

        let teamOneAutoPaths = await autoPathsTeam(user, team1)
        let teamTwoAutoPaths = await autoPathsTeam(user, team2)
        let teamThreeAutoPaths = await autoPathsTeam(user, team3)




        //constants: total points, teams {team, role, autoPaths, averagePoints}
        return {
            totalPoints : teamOnePoints.average + teamTwoPoints.average + teamThreePoints.average,
            teams :[{ team : team1, role : teamOneMainRole, averagePoints : teamOnePoints.average, paths : teamOneAutoPaths},
                {team : team2, role : teamTwoMainRole, averagePoints : teamTwoPoints.average, paths : teamTwoAutoPaths},
                {team : team3, role : teamThreeMainRole, averagePoints : teamThreePoints.average, paths : teamThreeAutoPaths}
            ],
            speakerScores : teamOneSpeakerScores.average + teamTwoSpeakerScores.average + teamThreeSpeakerScores.average,
            ampScores : teamOneAmpScores.average + teamTwoAmpScores.average + teamThreeAmpScores.average
        }

    }
    catch (error) {
        console.log(error)
        throw (error)
    }

};