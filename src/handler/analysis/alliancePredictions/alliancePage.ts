import { arrayAndAverageTeam } from "../coreAnalysis/arrayAndAverageTeam";
import { robotRole } from "../coreAnalysis/robotRole";
import { autoPathsTeam } from "../autoPaths/autoPathsTeam";
import { User } from "@prisma/client";
import { Metric } from "../analysisConstants";


export const alliancePage = async (user : User, team1 : number, team2 : number, team3 : number): Promise<{totalPoints : number, teams : Array<object>, speakerScores : number, ampScores : number}> =>{
    try {
        const teamOnePoints = await arrayAndAverageTeam(user, Metric.totalpoints, team1)    
        const teamTwoPoints = await arrayAndAverageTeam(user, Metric.totalpoints, team2)
        const teamThreePoints = await arrayAndAverageTeam(user, Metric.totalpoints, team3)

        const teamOneMainRole = (await robotRole(user, team1)).mainRole
        const teamTwoMainRole = (await robotRole(user, team2)).mainRole
        const teamThreeMainRole = (await robotRole(user, team3)).mainRole

        const teamOneSpeakerScores = await arrayAndAverageTeam(user, Metric.speakerscores, team1)
        const teamTwoSpeakerScores = await arrayAndAverageTeam(user, Metric.speakerscores, team2)
        const teamThreeSpeakerScores = await arrayAndAverageTeam(user, Metric.speakerscores, team3)


        const teamOneAmpScores = await arrayAndAverageTeam(user, Metric.ampscores, team1)
        const teamTwoAmpScores = await arrayAndAverageTeam(user, Metric.ampscores, team2)
        const teamThreeAmpScores = await arrayAndAverageTeam(user, Metric.ampscores, team3)

        const teamOneAutoPaths = await autoPathsTeam(user, team1)
        const teamTwoAutoPaths = await autoPathsTeam(user, team2)
        const teamThreeAutoPaths = await autoPathsTeam(user, team3)




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