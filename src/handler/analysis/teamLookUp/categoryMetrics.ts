import z from "zod";
import { CustomFieldType } from "@prisma/client";
import prismaClient from "../../../prismaClient.js";
import { metricsCategory, metricToName } from "../analysisConstants.js";
import { arrayAndAverageTeams } from "../coreAnalysis/arrayAndAverageTeams.js";
import { createAnalysisHandler } from "../analysisHandler.js";
import { customFieldNumberManyFast } from "../customFields/customFieldNumberAverages.js";
import {
  cfKey,
  getActiveCustomFields,
} from "../customFields/customFieldShared.js";

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

    const reportCount = await prismaClient.scoutReport.count({
      where: {
        teamMatchData: {
          teamNumber: params.team,
        },
      },
    });

    if (reportCount === 0) {
      return { error: "NO_DATA_FOR_TEAM" };
    }

    const result: Record<string, any> = {};

    for (const metric of metricsCategory) {
      const teamAverageAndTimeLine = (
        await arrayAndAverageTeams(ctx.user, {
          teams: [params.team],
          metric,
        })
      )[params.team];
      result[metricToName[metric]] = teamAverageAndTimeLine.average;
    }

    return result;
  },
  // Custom NUMBER field averages are viewer-scoped, so they ride on the
  // response via this hook and are never written into the shared cache row.
  // The custom values themselves are cached separately (viewer-keyed) by
  // customFieldNumberManyFast. When the viewer has no team or no active
  // NUMBER fields, the response is byte-identical to today's.
  augmentResponse: async ({ params }, ctx, result) => {
    const viewerTeam = ctx.user.teamNumber;
    if (viewerTeam === null || viewerTeam === undefined) return result;

    const fields = await getActiveCustomFields(viewerTeam, [
      CustomFieldType.NUMBER,
    ]);
    if (fields.length === 0) return result;

    const averages = await customFieldNumberManyFast(ctx.user, {
      viewerTeam: viewerTeam,
      teams: [params.team],
      fieldUuids: fields.map((field) => field.uuid),
    });

    // Never mutate result: on cache misses the raw object is what gets stored
    const augmented: Record<string, any> = { ...result };
    const customFields: {
      uuid: string;
      metricKey: string;
      name: string;
      order: number;
      average: number | null;
    }[] = [];

    for (const field of fields) {
      // Already rounded to 2dp by runAnalysis
      const average = averages[field.uuid]?.[String(params.team)] ?? null;
      const metricKey = cfKey(field.uuid);
      if (average !== null) {
        augmented[metricKey] = average;
      }
      customFields.push({
        uuid: field.uuid,
        metricKey: metricKey,
        name: field.name,
        order: field.order,
        average: average,
      });
    }

    augmented.customFields = customFields;
    return augmented;
  },
});
