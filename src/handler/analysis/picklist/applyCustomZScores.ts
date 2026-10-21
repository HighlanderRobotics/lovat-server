import { defaultSTD } from "../analysisConstants.js";
import { CustomFieldNumberManyFastResult } from "../customFields/customFieldNumberAverages.js";
import { cfKey } from "../customFields/customFieldShared.js";

type PicklistEntry = {
  team: number;
  result: number;
  breakdown: { type: string; result: number }[];
  unweighted: { type: string; result: number }[];
  flags: { type: string; result: number }[];
};

/**
 * Sibling of zScoreMany for custom NUMBER field picklist weights. For each
 * weighted field, computes each team's z-score (mean and population standard
 * deviation over teams with a non-null average; null averages contribute a
 * z-score of 0; defaultSTD fallback like zScoreMany), then pushes
 * { type: "cf_<uuid>", result } entries onto every team's breakdown (weighted)
 * and unweighted arrays and adds the weighted score into the team's total.
 * Must run BEFORE the final sort — mutates `results` in place.
 *
 * @param results output of zScoreMany (totals already summed)
 * @param teams team numbers included in the picklist
 * @param averages customFieldNumberManyFast output: fieldUuid -> team -> avg|null
 * @param weights fieldUuid -> non-zero weight
 */
export const applyCustomZScores = (
  results: PicklistEntry[],
  teams: number[],
  averages: CustomFieldNumberManyFastResult,
  weights: Record<string, number>,
): void => {
  const entriesByTeam = new Map<number, PicklistEntry>();
  for (const entry of results) {
    entriesByTeam.set(entry.team, entry);
  }

  for (const fieldUuid of Object.keys(weights)) {
    const perTeam = averages[fieldUuid] ?? {};

    // Mean and population standard deviation over non-null values only
    const nonNullValues: number[] = [];
    for (const team of teams) {
      const value = perTeam[String(team)];
      if (typeof value === "number") nonNullValues.push(value);
    }

    let mean = 0;
    let std = 0;
    if (nonNullValues.length > 0) {
      mean =
        nonNullValues.reduce((acc, cur) => acc + cur, 0) / nonNullValues.length;
      const variance =
        nonNullValues.reduce(
          (acc, cur) => acc + (cur - mean) * (cur - mean),
          0,
        ) / nonNullValues.length;
      std = Math.sqrt(variance);
    }

    const metricKey = cfKey(fieldUuid);
    for (const team of teams) {
      const entry = entriesByTeam.get(team);
      if (!entry) continue;

      const value = perTeam[String(team)];
      // Teams without data (null) contribute a z-score of 0
      const zScore =
        typeof value === "number" ? (value - mean) / (std || defaultSTD) : 0;
      const weighted = zScore * weights[fieldUuid];

      entry.breakdown.push({ type: metricKey, result: weighted });
      entry.unweighted.push({ type: metricKey, result: zScore });
      entry.result += weighted;
    }
  }
};
