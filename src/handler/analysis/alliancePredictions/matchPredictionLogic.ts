import z from "zod";
import { User } from "@prisma/client";
import { Metric } from "../analysisConstants";
import { arrayAndAverageTeams } from "../coreAnalysis/arrayAndAverageTeams";

export const matchPredictionLogic = async (
  user: User,
  red1,
  red2,
  red3,
  blue1,
  blue2,
  blue3,
): Promise<{
  red1: number;
  red2: number;
  red3: number;
  blue1: number;
  blue2: number;
  blue3: number;
  redWinning: number;
  blueWinning: number;
  winningAlliance: number;
}> => {
  try {
    const params = z
      .object({
        red1: z.preprocess((x) => (x ? x : undefined), z.coerce.number().int()),
        red2: z.preprocess((x) => (x ? x : undefined), z.coerce.number().int()),
        red3: z.preprocess((x) => (x ? x : undefined), z.coerce.number().int()),
        blue1: z.preprocess(
          (x) => (x ? x : undefined),
          z.coerce.number().int(),
        ),
        blue2: z.preprocess(
          (x) => (x ? x : undefined),
          z.coerce.number().int(),
        ),
        blue3: z.preprocess(
          (x) => (x ? x : undefined),
          z.coerce.number().int(),
        ),
      })
      .safeParse({
        red1: red1,
        red2: red2,
        red3: red3,
        blue1: blue1,
        blue2: blue2,
        blue3: blue3,
      });
    if (!params.success) {
      throw params;
    }

    const redArrs = await arrayAndAverageTeams(
      user,
      [params.data.red1, params.data.red2, params.data.red3],
      Metric.totalPoints,
    );
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
      //not enough data
      throw "not enough data";
    }
    const red1SDV = getSDV(redArr1);
    const red2SDV = getSDV(redArr2);
    const red3SDV = getSDV(redArr3);

    const redAllianceSDV = Math.sqrt(
      Math.pow(red1SDV, 2) + Math.pow(red2SDV, 2) + Math.pow(red3SDV, 2),
    );
    const redAllianceMean =
      (await getMean(redArr1)) +
      (await getMean(redArr2)) +
      (await getMean(redArr3));

    const blueArrs = await arrayAndAverageTeams(
      user,
      [params.data.blue1, params.data.blue2, params.data.blue3],
      Metric.totalPoints,
    );
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
      //not enough data
      throw "not enough data";
    }
    const blue1SDV = getSDV(blueArr1);
    const blue2SDV = getSDV(blueArr2);
    const blue3SDV = getSDV(blueArr3);

    const blueAllianceSDV = Math.sqrt(
      Math.pow(blue1SDV, 2) + Math.pow(blue2SDV, 2) + Math.pow(blue3SDV, 2),
    );
    const blueAllianceMean =
      (await getMean(blueArr1)) +
      (await getMean(blueArr2)) +
      (await getMean(blueArr3));

    const differentialSDV = Math.sqrt(
      Math.pow(redAllianceSDV, 2) + Math.pow(blueAllianceSDV, 2),
    );
    const differentialMean = redAllianceMean - blueAllianceMean;

    const redLoosing = await getZPercent(
      (0 - differentialMean) / differentialSDV,
    );

    const redWinning = 1 - redLoosing;
    const blueWiinning = 1 - redWinning;

    //starting at 1 (1 = blue, 0 = red)
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
  } catch (error) {
    console.log(error);
    throw error;
  }
};
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
