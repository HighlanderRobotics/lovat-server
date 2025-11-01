import prismaClient from "../../../prismaClient";
import z from "zod";
import { FlippedActionMap, FlippedPositionMap } from "../analysisConstants";
import { createAnalysisHandler } from "../analysisHandler";

export const timelineForScoutReport = createAnalysisHandler({
  params: {
    params: z.object({
      uuid: z.string(),
    }),
  },
  usesDataSource: false,
  createKey: ({ params }) => {
    return {
      key: ["timelineForScoutReport", params.uuid],
      teamDependencies: [],
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
