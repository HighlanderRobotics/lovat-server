import prismaClient from "../../../prismaClient.js";
import z from "zod";
import { FlippedActionMap, FlippedPositionMap } from "../analysisConstants.js";
import { createAnalysisHandler } from "../analysisHandler.js";

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
      if (element.points !== 0) {
        timelineArray.push([
          element.time,
          FlippedActionMap[element.action],
          FlippedPositionMap[element.position],
          element.points,
        ]);
      } else {
        timelineArray.push([
          element.time,
          FlippedActionMap[element.action],
          FlippedPositionMap[element.position],
        ]);
      }
    }

    return timelineArray;
  },
});
