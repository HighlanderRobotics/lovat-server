import z from "zod";
import { alliancePage } from "./alliancePage";
import { matchPredictionLogic } from "./matchPredictionLogic";
import { createAnalysisHandler } from "../analysisHandler";

export const matchPrediction = createAnalysisHandler({
  params: {
    query: z.object({
      red1: z.preprocess((x) => (x ? x : undefined), z.coerce.number().int()),
      red2: z.preprocess((x) => (x ? x : undefined), z.coerce.number().int()),
      red3: z.preprocess((x) => (x ? x : undefined), z.coerce.number().int()),
      blue1: z.preprocess((x) => (x ? x : undefined), z.coerce.number().int()),
      blue2: z.preprocess((x) => (x ? x : undefined), z.coerce.number().int()),
      blue3: z.preprocess((x) => (x ? x : undefined), z.coerce.number().int()),
    }),
  },
  usesDataSource: true,
  shouldCache: true,
  createKey: ({ query }) => {
    const red = [
      query.red1.toString(),
      query.red2.toString(),
      query.red3.toString(),
    ].sort();
    const blue = [
      query.blue1.toString(),
      query.blue2.toString(),
      query.blue3.toString(),
    ].sort();

    return {
      key: [
        "matchPrediction",
        ...(red[0] >= blue[0] ? red : blue),
        ...(red[0] < blue[0] ? red : blue),
      ],
      teamDependencies: [
        query.red1,
        query.red2,
        query.red3,
        query.blue1,
        query.blue2,
        query.blue3,
      ],
      tournamentDependencies: [],
    };
  },
  calculateAnalysis: async ({ query }, ctx) => {
    try {
      const matchPreictionData = await matchPredictionLogic(
        ctx.user,
        query.red1,
        query.red2,
        query.red3,
        query.blue1,
        query.blue2,
        query.blue3,
      );

      const redAlliance = await alliancePage(ctx.user, {
        team1: query.red1,
        team2: query.red2,
        team3: query.red3,
      });
      const blueAlliance = await alliancePage(ctx.user, {
        team1: query.blue1,
        team2: query.blue2,
        team3: query.blue3,
      });

      return {
        red1: query.red1,
        red2: query.red2,
        red3: query.red3,
        blue1: query.blue1,
        blue2: query.blue2,
        blue3: query.blue3,
        redWinning: matchPreictionData.redWinning,
        blueWinning: matchPreictionData.blueWinning,
        winningAlliance: matchPreictionData.winningAlliance,
        //dont display auto path stuff
        redAlliance: redAlliance,
        blueAlliance: blueAlliance,
      };
    } catch (error) {
      if (error === "not enough data") {
        return { error: "not enough data" };
      }
    }
  },
});
// export const matchPrediction = async (
//   req: AuthenticatedRequest,
//   res: Response,
// ): Promise<object> => {
// try {
//   const params = paramsSchema
//     .safeParse({
//       red1: req.query.red1,
//       red2: req.query.red2,
//       red3: req.query.red3,
//       blue1: req.query.blue1,
//       blue2: req.query.blue2,
//       blue3: req.query.blue3,
//     });
//   if (!params.success) {
//     res.status(200).send(params);
//     return;
//   }
//   const matchPreictionData = await matchPredictionLogic(
//     req.user,
//     params.data.red1,
//     params.data.red2,
//     params.data.red3,
//     params.data.blue1,
//     params.data.blue2,
//     params.data.blue3,
//   );

//   const redAlliance = await alliancePage(
//     req.user,
//     params.data.red1,
//     params.data.red2,
//     params.data.red3,
//   );
//   const blueAlliance = await alliancePage(
//     req.user,
//     params.data.blue1,
//     params.data.blue2,
//     params.data.blue3,
//   );

//   res.status(200).send({
//     red1: params.data.red1,
//     red2: params.data.red2,
//     red3: params.data.red3,
//     blue1: params.data.blue1,
//     blue2: params.data.blue2,
//     blue3: params.data.blue3,
//     redWinning: matchPreictionData.redWinning,
//     blueWinning: matchPreictionData.blueWinning,
//     winningAlliance: matchPreictionData.winningAlliance,
//     //dont display auto path stuff
//     redAlliance: redAlliance,
//     blueAlliance: blueAlliance,
//   });
//   } catch (error) {
//     console.log(error);
//     if (error === "not enough data") {
//       res.status(200).send("not enough data");
//       return;
//     } else {
//       res.status(500).send(error);
//     }
//   }
// };
// unused
//
// async function getZPercent(z: number) {
//   if (z < -6.5) return 0.0;
//   if (z > 6.5) return 1.0;

//   let factK = 1;
//   let sum = 0;
//   let term = 1;
//   let k = 0;
//   const loopStop = Math.exp(-23);
//   while (Math.abs(term) > loopStop) {
//     term =
//       (((0.3989422804 * Math.pow(-1, k) * Math.pow(z, k)) /
//         (2 * k + 1) /
//         Math.pow(2, k)) *
//         Math.pow(z, k + 1)) /
//       factK;
//     sum += term;
//     k++;
//     factK *= k;
//   }
//   sum += 0.5;

//   return sum;
// }
// async function getMean(teamArray: number[]) {
//   let total = 0;
//   for (const teamEntry of teamArray) {
//     total += teamEntry;
//   }
//   return total / teamArray.length;
// }
