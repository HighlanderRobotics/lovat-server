import { arrayAndAverageTeam } from "../coreAnalysis/arrayAndAverageTeam";
import { robotRole } from "../coreAnalysis/robotRole";
import { autoPathsTeam } from "../autoPaths/autoPathsTeam";
import { User } from "@prisma/client";
import { Metric } from "../analysisConstants";


export const alliancePage = async (user : User, team1 : number, team2 : number, team3 : number): Promise<{totalPoints : number, teams : object[] }> =>{
    try {
        const teamOnePoints = await arrayAndAverageTeam(user, Metric.totalPoints, team1)    
        const teamTwoPoints = await arrayAndAverageTeam(user, Metric.totalPoints, team2)
        const teamThreePoints = await arrayAndAverageTeam(user, Metric.totalPoints, team3)

        const teamOneMainRole = (await robotRole(user, team1)).mainRole
        const teamTwoMainRole = (await robotRole(user, team2)).mainRole
        const teamThreeMainRole = (await robotRole(user, team3)).mainRole

        const teamOneAutoPaths = await autoPathsTeam(user, team1)
        const teamTwoAutoPaths = await autoPathsTeam(user, team2)
        const teamThreeAutoPaths = await autoPathsTeam(user, team3)




        //constants: total points, teams {team, role, autoPaths, averagePoints}
        return {
            totalPoints : teamOnePoints.average + teamTwoPoints.average + teamThreePoints.average,
            teams :[{ team : team1, role : teamOneMainRole, averagePoints : teamOnePoints.average, paths : teamOneAutoPaths},
                {team : team2, role : teamTwoMainRole, averagePoints : teamTwoPoints.average, paths : teamTwoAutoPaths},
                {team : team3, role : teamThreeMainRole, averagePoints : teamThreePoints.average, paths : teamThreeAutoPaths}
            ]
        }

    }
    catch (error) {
        console.log(error)
        throw (error)
    }

};