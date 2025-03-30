import { robotRole } from "../coreAnalysis/robotRole";
import { autoPathsTeam } from "../autoPaths/autoPathsTeam";
import { User } from "@prisma/client";
import { Metric } from "../analysisConstants";
import { arrayAndAverageManyFast } from "../coreAnalysis/arrayAndAverageManyFast";
import { arrayAndAverageTeams } from "../coreAnalysis/arrayAndAverageTeams";


export const alliancePage = async (user : User, team1 : number, team2 : number, team3 : number): Promise<{totalPoints : number, teams : object[], coralL1: number, coralL2: number, coralL3: number, coralL4: number, processor: number, net: number}> =>{
    try {
        const teamPoints  = await arrayAndAverageTeams([team1, team2, team3], Metric.totalPoints, user)

        const teamOneMainRole = (await robotRole(user, team1)).mainRole
        const teamTwoMainRole = (await robotRole(user, team2)).mainRole
        const teamThreeMainRole = (await robotRole(user, team3)).mainRole

        const teamOneAutoPaths = await autoPathsTeam(user, team1)
        const teamTwoAutoPaths = await autoPathsTeam(user, team2)
        const teamThreeAutoPaths = await autoPathsTeam(user, team3)

        const teamData = await arrayAndAverageManyFast([team1, team2, team3], [Metric.coralL1, Metric.coralL2, Metric.coralL3, Metric.coralL4, Metric.processorScores, Metric.netScores], user);

        //constants: total points, teams {team, role, autoPaths, averagePoints}
        return {
            totalPoints : teamPoints[team1].average + teamPoints[team2].average + teamPoints[team3].average,
            teams :[{ team : team1, role : teamOneMainRole, averagePoints : teamPoints[team1].average, paths : teamOneAutoPaths, },
                {team : team2, role : teamTwoMainRole, averagePoints : teamPoints[team2].average, paths : teamTwoAutoPaths},
                {team : team3, role : teamThreeMainRole, averagePoints : teamPoints[team3].average, paths : teamThreeAutoPaths}
            ],
            coralL1: teamData[Metric.coralL1][team1] + teamData[Metric.coralL1][team2] + teamData[Metric.coralL1][team3],
            coralL2: teamData[Metric.coralL2][team1] + teamData[Metric.coralL2][team2] + teamData[Metric.coralL2][team3],
            coralL3: teamData[Metric.coralL3][team1] + teamData[Metric.coralL3][team2] + teamData[Metric.coralL3][team3],
            coralL4: teamData[Metric.coralL4][team1] + teamData[Metric.coralL4][team2] + teamData[Metric.coralL4][team3],
            processor: teamData[Metric.processorScores][team1] + teamData[Metric.processorScores][team2] + teamData[Metric.processorScores][team3],
            net: teamData[Metric.netScores][team1] + teamData[Metric.netScores][team2] + teamData[Metric.netScores][team3]
        }

    }
    catch (error) {
        console.log(error)
        throw (error)
    }

};