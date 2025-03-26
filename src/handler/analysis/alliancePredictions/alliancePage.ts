import { arrayAndAverageTeam } from "../coreAnalysis/arrayAndAverageTeam";
import { robotRole } from "../coreAnalysis/robotRole";
import { autoPathsTeam } from "../autoPaths/autoPathsTeam";
import { User } from "@prisma/client";
import { Metric } from "../analysisConstants";
import { arrayAndAverageManyFast } from "../coreAnalysis/arrayAndAverageManyFast";


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

        const teamData = await arrayAndAverageManyFast([team1, team2, team3], [Metric.coralL1, Metric.coralL2, Metric.coralL3, Metric.coralL4, Metric.processorScores, Metric.netScores], user);

        //constants: total points, teams {team, role, autoPaths, averagePoints}
        return {
            totalPoints : teamOnePoints.average + teamTwoPoints.average + teamThreePoints.average,
            teams :[{ team : team1, role : teamOneMainRole, averagePoints : teamOnePoints.average, paths : teamOneAutoPaths, },
                {team : team2, role : teamTwoMainRole, averagePoints : teamTwoPoints.average, paths : teamTwoAutoPaths},
                {team : team3, role : teamThreeMainRole, averagePoints : teamThreePoints.average, paths : teamThreeAutoPaths}
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