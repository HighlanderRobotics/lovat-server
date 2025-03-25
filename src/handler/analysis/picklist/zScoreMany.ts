import { Metric, metricsCategory, metricToName, picklistToMetric } from "../analysisConstants"
import ss from "simple-statistics";
import { rankFlag } from "../rankFlag";

export const zScoreMany = async (data: Partial<Record<Metric, { average: number }[]>>, teams: number[], eventKey: string, queries: Record<string, number>, flags: string[]) => {
    try {
        const results: {
            team: number,
            result: number,
            breakdown: { type: string, result: number }[],
            unweighted: { type: string, result: number }[],
            flags: { type: string, result: number }[]
        }[] = [];

        // Include flagged metrics
        const includedMetrics = new Array<Metric>;
        for (const metric of metricsCategory) {
            if (flags.includes(metricToName[metric])) {
                includedMetrics.push(metric);
            }
        }

        // Flags (held as category metrics) and object initialization first
        teams.forEach((team, i) => {
            results[i] ||= {
                team: team,
                result: 0,
                breakdown: [],
                unweighted: [],
                flags: []
            };

            for (const metric of includedMetrics) {
                results[i].flags.push({ type: metricToName[metric], result: data[metric][team].average });
            }
        });

        // Picklist rankings and zScore
        for (const picklistParam of Object.keys(picklistToMetric)) {
            if (queries[picklistParam]) {
                // Initialize variables for parameter
                const currAvgs = data[picklistToMetric[picklistParam]];
                const condensedAvgs: number[] = [];
                currAvgs.forEach(e => condensedAvgs.push(e.average));

                const avg = condensedAvgs.reduce((acc, cur) => acc + cur, 0) / teams.length;
                const std = ss.standardDeviation(condensedAvgs);

                teams.forEach((team, i) => {
                    let zScore = 0

                    // If there is a meaningful datapoint, calculate zScore
                    if (currAvgs[team].average !== 0) {
                        // Default standard deviation to 0.1
                        zScore = (currAvgs[team].average - avg) / (std || 0.1);
                    }

                    // Push scores
                    results[i].breakdown.push({ type: picklistParam, result: zScore * queries[picklistParam] });
                    results[i].unweighted.push({ type: picklistParam, result: zScore });
                });
            }
        }

        // Deal with rankings
        if (flags.includes("rank")) {
            const rankings = await rankFlag(eventKey, ...teams);

            teams.forEach((team, i) => {
                results[i].flags.push({ type: "rank", result: rankings[team] });
            });
        }

        // Sum total z score
        for (let i = 0; i < results.length; i++) {
            results[i].result = results[i].breakdown.reduce((acc, cur) => acc + cur.result, 0);
        }

        return results;
    }
    catch (error) {
        console.log(error)
        throw (error)
    }
}