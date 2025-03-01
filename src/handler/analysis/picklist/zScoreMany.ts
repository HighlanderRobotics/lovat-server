import axios from "axios";
import { Metric, metricsCategory, metricToName, picklistToMetric } from "../analysisConstants"
import ss from "simple-statistics";

export const zScoreMany = async (data: Partial<Record<Metric, { average: number }[]>>, teams: number[], eventKey: string, queries: Record<string, number>, flags: string[]): Promise<typeof results> => {
    const results: {
        team: number,
        zScore: number,
        adjusted: { type: string, result: number }[],
        unadjusted: { type: string, result: number }[],
        flags: { type: string, result: number }[]
    }[] = [];

    // Flags (held as category metrics) and object initialization first
    for (const [i, team] of teams.entries()) {
        results[i] ||= {
            team: team,
            zScore: 0,
            adjusted: [],
            unadjusted: [],
            flags: []
        };

        for (const metric of metricsCategory) {
            if (flags.includes(metricToName[metric])) {
                // Push flagged metrics
                results[i].flags.push({ type: metricToName[metric], result: data[metric][team].average });
            }
        }
    }

    // Picklist rankings and zScore
    for (const picklistParam of Object.keys(picklistToMetric)) {
        if (queries[picklistParam]) {
            // Initialize average and standard deviation for parameter
            const currAvgs = data[picklistToMetric[picklistParam]];
            const avg = currAvgs.reduce((acc, cur) => {
                return acc + cur.average;
            }, 0) / teams.length;
            const std = ss.standardDeviation(currAvgs.map(e => e.average));

            for (const [i, team] of teams.entries()) {
                // If there is a meaningful datapoint, calculate zScore
                if (currAvgs[team].average !== 0) {
                    // Default standard deviation to 0.1
                    results[i].zScore = (currAvgs[team].average - avg) / (std || 0.1);
                }
    
                // Push adjusted/unadjusted scores
                results[i].adjusted.push({ type: picklistParam, result: results[i].zScore * queries[picklistParam] });
                results[i].unadjusted.push({ type: picklistParam, result: results[i].zScore });
            }
        }
    }

    // Deal with rankings
    if (flags.includes("rank")) {
        // TBA request
        const response = await axios.get(`https://www.thebluealliance.com/api/v3/event/${eventKey}/rankings`, {
            headers: { 'X-TBA-Auth-Key': process.env.TBA_KEY }
        });

        for (const [i, team] of teams.entries()) {
            const ri = response.data.rankings.findIndex(currRanking => currRanking.team_key === `frc${team}`);
            results[i].flags.push({ type: "rank", result: response.data.rankings[ri].rank });
        }
    }

    return results;
}