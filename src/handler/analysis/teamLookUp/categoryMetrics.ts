import z from "zod";
import prismaClient from "../../../prismaClient.js";
import { metricsCategory, metricToName } from "../analysisConstants.js";
import { averageManyFast } from "../coreAnalysis/averageManyFast.js";
import { createAnalysisHandler } from "../analysisHandler.js";


export const categoryMetrics = createAnalysisHandler({
 params: {
   params: z.object({
     team: z.preprocess((x) => Number(x), z.number()),
   }),
 },


 usesDataSource: true,
 shouldCache: true,
 createKey: ({ params }) => {
   return {
     key: ["categoryMetrics", params.team.toString()],
     teamDependencies: [params.team],
     tournamentDependencies: [],
   };
 },
 calculateAnalysis: async ({ params }, ctx) => {
   const teamRow = await prismaClient.team.findUnique({
     where: { number: params.team },
     select: { number: true },
   });


   if (!teamRow) {
     return { error: "TEAM_DOES_NOT_EXIST" };
   }


   const result: Record<string, any> = {};


   const data = await averageManyFast(ctx.user, {
     teams: [params.team],
     metrics: metricsCategory,
   });


   let hasAnyData = false;
   for (const metric of metricsCategory) {
     const value = data[metric][params.team];
     result[metricToName[metric]] = value;
     if (value !== null && value !== undefined && value !== 0) {
       hasAnyData = true;
     }
   }


   if (!hasAnyData) {
     return { error: "NO_DATA_FOR_TEAM" };
   }


   return result;
 },
});
