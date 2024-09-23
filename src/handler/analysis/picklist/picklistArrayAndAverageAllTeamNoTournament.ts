import { User } from "@prisma/client";
import { arrayAndAverageTeamFast } from "../coreAnalysis/arrayAndAverageTeamFast";
import { Metric } from "../analysisConstants";


export const picklistArrayAndAverageAllTeamNoTournament = async (user: User, metric: Metric, teams: Array<number>): Promise<{ average: number, teamAverages: Map<number, number>, timeLine: Array<number> }> => {
    try {


        let timeLineArray = []
        const teamAveragesMap: Map<number, number> = new Map()
        let average = 0
        for (const team of teams) {
            let currAvg = (await (arrayAndAverageTeamFast(user, metric, team))).average
            if (!currAvg) {
                currAvg = 0
            }
            timeLineArray = timeLineArray.concat(currAvg)
            teamAveragesMap[team] = currAvg;

        };
        if (timeLineArray.length !== 0) {
            average = timeLineArray.reduce((acc, cur) => acc + cur.average, 0) / timeLineArray.length;
        }

        return {
            average: average,
            teamAverages: teamAveragesMap,
            timeLine: timeLineArray
        }

    }
    catch (error) {
        console.error(error)
        throw (error)
    }

};