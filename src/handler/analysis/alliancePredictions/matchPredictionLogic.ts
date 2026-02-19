import z from "zod";
import { Metric } from "../analysisConstants.js";
import { arrayAndAverageTeams } from "../coreAnalysis/arrayAndAverageTeams.js";
import { runAnalysis } from "../analysisFunction.js";
import { User } from "@prisma/client";

const config = {
  argsSchema: z.object({
    red1: z.coerce.number().int(),
    red2: z.coerce.number().int(),
    red3: z.coerce.number().int(),
    blue1: z.coerce.number().int(),
    blue2: z.coerce.number().int(),
    blue3: z.coerce.number().int(),
  }),
  returnSchema: z.object({
    red1: z.number(),
    red2: z.number(),
    red3: z.number(),
    blue1: z.number(),
    blue2: z.number(),
    blue3: z.number(),
    redWinning: z.number(),
    blueWinning: z.number(),
    winningAlliance: z.number(),
  }),
  usesDataSource: true,
  shouldCache: true,
  createKey: async (args) => ({
    key: [
      "matchPredictionLogic",
      ...[args.red1, args.red2, args.red3].sort().map(String),
      ...[args.blue1, args.blue2, args.blue3].sort().map(String),
    ],
    teamDependencies: [
      args.red1,
      args.red2,
      args.red3,
      args.blue1,
      args.blue2,
      args.blue3,
    ],
  }),
  calculateAnalysis: async (args, ctx) => {
    const params = { data: args } as const;

    const redArrs = await arrayAndAverageTeams(ctx.user, {
      teams: [params.data.red1, params.data.red2, params.data.red3],
      metric: Metric.totalPoints,
    });
    const redArr1 = redArrs[params.data.red1].timeLine.map(
      (item) => item.dataPoint,
    );
    const redArr2 = redArrs[params.data.red2].timeLine.map(
      (item) => item.dataPoint,
    );
    const redArr3 = redArrs[params.data.red3].timeLine.map(
      (item) => item.dataPoint,
    );

    if (redArr1.length <= 1 || redArr2.length <= 1 || redArr3.length <= 1) {
      throw "not enough data";
    }
    const red1SDV = getSDV(redArr1);
    const red2SDV = getSDV(redArr2);
    const red3SDV = getSDV(redArr3);

    const redAllianceSDV = Math.sqrt(
      Math.pow(red1SDV, 2) + Math.pow(red2SDV, 2) + Math.pow(red3SDV, 2),
    );
    const redAllianceMean =
      getMean(redArr1) + getMean(redArr2) + getMean(redArr3);

    const blueArrs = await arrayAndAverageTeams(ctx.user, {
      teams: [params.data.blue1, params.data.blue2, params.data.blue3],
      metric: Metric.totalPoints,
    });
    const blueArr1 = blueArrs[params.data.blue1].timeLine.map(
      (item) => item.dataPoint,
    );
    const blueArr2 = blueArrs[params.data.blue2].timeLine.map(
      (item) => item.dataPoint,
    );
    const blueArr3 = blueArrs[params.data.blue3].timeLine.map(
      (item) => item.dataPoint,
    );

    if (blueArr1.length <= 1 || blueArr2.length <= 1 || blueArr3.length <= 1) {
      throw "not enough data";
    }
    const blue1SDV = getSDV(blueArr1);
    const blue2SDV = getSDV(blueArr2);
    const blue3SDV = getSDV(blueArr3);

    const blueAllianceSDV = Math.sqrt(
      Math.pow(blue1SDV, 2) + Math.pow(blue2SDV, 2) + Math.pow(blue3SDV, 2),
    );
    const blueAllianceMean =
      getMean(blueArr1) + getMean(blueArr2) + getMean(blueArr3);

    const differentialSDV = Math.sqrt(
      Math.pow(redAllianceSDV, 2) + Math.pow(blueAllianceSDV, 2),
    );
    const differentialMean = redAllianceMean - blueAllianceMean;

    const redLoosing = getZPercent((0 - differentialMean) / differentialSDV);

    const redWinning = 1 - redLoosing;
    const blueWiinning = 1 - redWinning;

    let winningAlliance = 1;
    if (Math.max(redWinning, blueWiinning) == redWinning) {
      winningAlliance = 0;
    }

    return {
      red1: params.data.red1,
      red2: params.data.red2,
      red3: params.data.red3,
      blue1: params.data.blue1,
      blue2: params.data.blue2,
      blue3: params.data.blue3,
      redWinning: redWinning,
      blueWinning: blueWiinning,
      winningAlliance: winningAlliance,
    };
  },
} as const;

export type MatchPredictionArgs = z.infer<typeof config.argsSchema>;
export type MatchPredictionResult = z.infer<typeof config.returnSchema>;
export async function matchPredictionLogic(
  user: User,
  args: MatchPredictionArgs,
): Promise<MatchPredictionResult> {
  return runAnalysis(config, user, args);
}

function getZPercent(z: number) {
  if (z < -6.5) return 0.0;
  if (z > 6.5) return 1.0;
  let factK = 1;
  let sum = 0;
  let term = 1;
  let k = 0;
  const loopStop = Math.exp(-23);
  while (Math.abs(term) > loopStop) {
    term =
      (((0.3989422804 * Math.pow(-1, k) * Math.pow(z, k)) /
        (2 * k + 1) /
        Math.pow(2, k)) *
        Math.pow(z, k + 1)) /
      factK;
    sum += term;
    k++;
    factK *= k;
  }
  sum += 0.5;
  return sum;
}
function getMean(teamArray: number[]) {
  let total = 0;
  for (const currTeamArray of teamArray) {
    total += currTeamArray;
  }
  return total / teamArray.length;
}
function getSDV(arr: number[]) {
  const mean = getMean(arr);
  let variance = 0;
  for (const num of arr) {
    variance += (num - mean) * (num - mean);
  }
  variance /= arr.length;
  return Math.sqrt(variance);
}
