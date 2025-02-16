import { User } from "@prisma/client";
import { arrayAndAverageTeamFast } from "../coreAnalysis/arrayAndAverageTeamFast";
import { Metric } from "../analysisConstants";

// Never used
export const picklistArrayAndAverageAllTeamNoTournament = async (user: User, metric: Metric, teams: number[]): Promise<{ average: number, teamAverages: Map<number, number>, timeLine: number[] }> => {
    try {


        let timeLineArray = []
        const teamAveragesMap = new Map<number, number>()
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