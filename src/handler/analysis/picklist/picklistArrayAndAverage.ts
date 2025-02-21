import { User } from "@prisma/client";
import { arrayAndAverageTeamFast } from "../coreAnalysis/arrayAndAverageTeamFast";
import { Metric } from "../analysisConstants";
import ss from 'simple-statistics';

/**
 * Return AATF of metric for all given teams, with a population average and standard deviation.
 *
 * Average defaults to 0 if data is lacking.
 */
export const picklistArrayAndAverage = async (user: User, metric: Metric, teams : number[]) : Promise<{ average: number, teamAverages: Record<number, number>, std: number }>=> {
    try {
        const timeLineArray: Promise<{ average: number }>[] = [];
        for (const team of teams) {
            timeLineArray.push(arrayAndAverageTeamFast(user, metric, team));
        };

        let average: number, std: number;
        const teamAveragesMap: Record<number, number> = {}

        await Promise.all(timeLineArray).then((values) => {
            average = (values.reduce((acc, cur) => acc + cur.average, 0) / values.length) || 0;
            std = ss.standardDeviation(values.map(item => item.average));

            teams.forEach((teamNumber, i) => {
                teamAveragesMap[teamNumber] = values[i].average || 0;
            });
        });

        return {
            average: average,
            teamAverages: teamAveragesMap,
            std: std
        }
    }
    catch (error) {
        console.error(error)
        throw (error)
    }
};