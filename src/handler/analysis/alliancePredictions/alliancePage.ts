import { arrayAndAverageTeam } from "../coreAnalysis/arrayAndAverageTeam";
import { robotRole } from "../coreAnalysis/robotRole";
import { autoPathsTeam } from "../autoPaths/autoPathsTeam";
import { User } from "@prisma/client";
import { Metric } from "../analysisConstants";
import { arrayAndAverageTeamFast } from "../coreAnalysis/arrayAndAverageTeamFast";


export const alliancePage = async (user : User, team1 : number, team2 : number, team3 : number): Promise<{totalPoints : number, teams : object[], coralL1: number, coralL2: number, coralL3: number, coralL4: number, processor: number, net: number}> =>{
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

        const teamOneScoreLevel1 = (await arrayAndAverageTeamFast(user, Metric.coralL1, team1)).average
        const teamTwoScoreLevel1 = (await arrayAndAverageTeamFast(user, Metric.coralL1, team2)).average
        const teamThreeScoreLevel1 = (await arrayAndAverageTeamFast(user, Metric.coralL1, team3)).average
        
        const teamOneScoreLevel2 = (await arrayAndAverageTeamFast(user, Metric.coralL2, team1)).average
        const teamTwoScoreLevel2 = (await arrayAndAverageTeamFast(user, Metric.coralL2, team2)).average
        const teamThreeScoreLevel2 = (await arrayAndAverageTeamFast(user, Metric.coralL2, team3)).average

        const teamOneScoreLevel3 = (await arrayAndAverageTeamFast(user, Metric.coralL3, team1)).average
        const teamTwoScoreLevel3 = (await arrayAndAverageTeamFast(user, Metric.coralL3, team2)).average
        const teamThreeScoreLevel3 = (await arrayAndAverageTeamFast(user, Metric.coralL3, team3)).average

        const teamOneScoreLevel4 = (await arrayAndAverageTeamFast(user, Metric.coralL4, team1)).average
        const teamTwoScoreLevel4 = (await arrayAndAverageTeamFast(user, Metric.coralL4, team2)).average
        const teamThreeScoreLevel4 = (await arrayAndAverageTeamFast(user, Metric.coralL4, team3)).average

        const teamOneScoreProcessor = (await arrayAndAverageTeamFast(user, Metric.processorScores, team1)).average
        const teamTwoScoreProcessor = (await arrayAndAverageTeamFast(user, Metric.processorScores, team2)).average
        const teamThreeScoreProcessor = (await arrayAndAverageTeamFast(user, Metric.processorScores, team3)).average

        const teamOneScoreNet = (await arrayAndAverageTeamFast(user, Metric.netScores, team1)).average
        const teamTwoScoreNet = (await arrayAndAverageTeamFast(user, Metric.netScores, team2)).average
        const teamThreeScoreNet = (await arrayAndAverageTeamFast(user, Metric.netScores, team3)).average


        //constants: total points, teams {team, role, autoPaths, averagePoints}
        return {
            totalPoints : teamOnePoints.average + teamTwoPoints.average + teamThreePoints.average,
            teams :[{ team : team1, role : teamOneMainRole, averagePoints : teamOnePoints.average, paths : teamOneAutoPaths, },
                {team : team2, role : teamTwoMainRole, averagePoints : teamTwoPoints.average, paths : teamTwoAutoPaths},
                {team : team3, role : teamThreeMainRole, averagePoints : teamThreePoints.average, paths : teamThreeAutoPaths}
            ],
            coralL1 : teamOneScoreLevel1 + teamTwoScoreLevel1 + teamThreeScoreLevel1,
            coralL2 : teamOneScoreLevel2 + teamTwoScoreLevel2 + teamThreeScoreLevel2,
            coralL3 : teamOneScoreLevel3 + teamTwoScoreLevel3 + teamThreeScoreLevel3,
            coralL4 : teamOneScoreLevel4 + teamTwoScoreLevel4 + teamThreeScoreLevel4,
            processor: teamOneScoreProcessor + teamTwoScoreProcessor + teamThreeScoreProcessor,
            net: teamOneScoreNet + teamTwoScoreNet + teamThreeScoreNet
        }

    }
    catch (error) {
        console.log(error)
        throw (error)
    }

};