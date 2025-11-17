import {
  defaultSTD,
  Metric,
  metricsCategory,
  metricToName,
  picklistToMetric,
} from "../analysisConstants";
import { computeRankFlag } from "../rankFlag";

/**
 * Take in data for many teams and return z-score values and breakdowns for queried metrics.
 *
 * @param data meant to take in an object from AAMF, organized metric => team number => predicted points
 * @param teams list of team numbers, should match those in the data column
 * @param tournamentKey tournament to use for team qualification rankings
 * @param queries map of parameters and weights to apply, given in strings matching picklist operators
 * @param flags flags to send along with data, given in strings matching category metrics
 * @returns object with total Z-score, breakdowns by metric, and flags; organized by team number
 */
export const zScoreMany = async (
  data: Partial<Record<Metric, Record<number, number>>>,
  teams: number[],
  tournamentKey: string,
  queries: Record<string, number>,
  flags: string[],
): Promise<
  {
    team: number;
    result: number;
    breakdown: { type: string; result: number }[];
    unweighted: { type: string; result: number }[];
    flags: { type: string; result: number }[];
  }[]
> => {
  try {
    const results: {
      team: number;
      result: number;
      breakdown: { type: string; result: number }[];
      unweighted: { type: string; result: number }[];
      flags: { type: string; result: number }[];
    }[] = [];

    // Include flagged metrics
    const includedMetrics = new Array<Metric>();
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
        flags: [],
      };

      for (const metric of includedMetrics) {
        results[i].flags.push({
          type: metricToName[metric],
          result: data[metric][team],
        });
      }
    });

    // Picklist rankings and zScore
    for (const picklistParam of Object.keys(picklistToMetric)) {
      if (queries[picklistParam]) {
        const currAvgs = data[picklistToMetric[picklistParam]];

        // Shouldn't matter if the following variables are NaN because of an empty teams list
        let avg = 0;
        teams.forEach((team) => (avg += currAvgs[team]));
        avg /= teams.length;

        // Population standard deviation
        let variance = 0;
        teams.forEach(
          (team) =>
            (variance += (currAvgs[team] - avg) * (currAvgs[team] - avg)),
        );
        variance /= teams.length;
        const std = Math.sqrt(variance);

        teams.forEach((team, i) => {
          let zScore = 0;

          // If there is a meaningful datapoint, calculate zScore
          if (currAvgs[team] !== 0) {
            // Put in terms of standard deviation, use default if necessary
            zScore = (currAvgs[team] - avg) / (std || defaultSTD);
          }

          // Push scores
          results[i].breakdown.push({
            type: picklistParam,
            result: zScore * queries[picklistParam],
          });
          results[i].unweighted.push({ type: picklistParam, result: zScore });
        });
      }
    }

    // Deal with rankings
    if (flags.includes("rank")) {
      const rankings = await computeRankFlag(tournamentKey, teams);

      teams.forEach((team, i) => {
        results[i].flags.push({ type: "rank", result: rankings[team] });
      });
    }

    // Sum total z score
    for (const singleResult of results) {
      singleResult.result = singleResult.breakdown.reduce(
        (acc, cur) => acc + cur.result,
        0,
      );
    }

    return results;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
