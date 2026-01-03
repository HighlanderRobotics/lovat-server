import prismaClient from "@/src/prismaClient.js";
import z from "zod";
import { FlippedActionMap, FlippedPositionMap } from "@/src/handler/analysis/analysisConstants.js";
import { createAnalysisHandler } from "@/src/handler/analysis/analysisHandler.js";

export const timelineForScoutReport = createAnalysisHandler({
  params: {
    params: z.object({
      uuid: z.string(),
    }),
  },
  usesDataSource: false,
  shouldCache: false,
  createKey: ({ params }) => {
    return {
      key: ["timelineForScoutReport", params.uuid],
      teamDependencies: [],
      tournamentDependencies: [],
    };
  },
  calculateAnalysis: async ({ params }) => {
    const events = await prismaClient.event.findMany({
      where: {
        scoutReportUuid: params.uuid,
      },
    });
    const timelineArray = [];
    for (const element of events) {
      timelineArray.push([
        element.time,
        FlippedActionMap[element.action],
        FlippedPositionMap[element.position],
      ]);
    }

    return timelineArray;
  },
});
