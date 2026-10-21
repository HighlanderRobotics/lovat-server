import z from "zod";
import { CustomFieldType } from "@prisma/client";
import prismaClient from "../../../prismaClient.js";
import { nonEventMetric } from "../coreAnalysis/nonEventMetric.js";
import { MetricsBreakdown } from "../analysisConstants.js";
import { createAnalysisHandler } from "../analysisHandler.js";
import { customFieldSelectDistribution } from "../customFields/customFieldSelectDistribution.js";
import {
  cfKey,
  getActiveCustomFields,
} from "../customFields/customFieldShared.js";

export const breakdownMetrics = createAnalysisHandler({
  params: {
    params: z.object({
      team: z.preprocess((x) => Number(x), z.number()),
    }),
  },
  usesDataSource: true,
  shouldCache: true,
  createKey: async ({ params }) => {
    return {
      key: ["breakdownMetrics", params.team.toString()],
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
    for (const [key, metric] of Object.entries(MetricsBreakdown)) {
      const data = await nonEventMetric(ctx.user, {
        team: params.team,
        metric: metric,
      });

      const valid = Object.values(data).some((val) => Boolean(val));

      if (valid) {
        result[key] = data;
      }
    }

    return result;
  },
  // Custom select-field distributions are viewer-scoped, so they ride on the
  // response via this hook and are never written into the shared cache row.
  // The distributions themselves are cached separately (viewer-keyed) by
  // customFieldSelectDistribution. Only fields with at least one answer are
  // included (no empty sections); with no team or no active select fields the
  // response is byte-identical to today's.
  augmentResponse: async ({ params }, ctx, result) => {
    const viewerTeam = ctx.user.teamNumber;
    if (viewerTeam === null || viewerTeam === undefined) return result;

    // Cheap pre-check so viewers without custom fields skip the cached
    // distribution function entirely (one indexed lookup)
    const activeSelectFields = await getActiveCustomFields(viewerTeam, [
      CustomFieldType.SINGLE_SELECT,
      CustomFieldType.MULTI_SELECT,
    ]);
    if (activeSelectFields.length === 0) return result;

    const distribution = await customFieldSelectDistribution(ctx.user, {
      viewerTeam: viewerTeam,
      team: params.team,
    });

    const answeredFields = distribution.fields.filter(
      (field) => field.answerCount > 0,
    );
    if (answeredFields.length === 0) return result;

    // Never mutate result: on cache misses the raw object is what gets stored
    const augmented: Record<string, any> = { ...result };
    const customFields: {
      uuid: string;
      metricKey: string;
      name: string;
      order: number;
      type: CustomFieldType;
      options: string[];
      answerCount: number;
    }[] = [];

    for (const field of answeredFields) {
      const metricKey = cfKey(field.uuid);
      augmented[metricKey] = field.percentages;
      customFields.push({
        uuid: field.uuid,
        metricKey: metricKey,
        name: field.name,
        order: field.order,
        type: field.type,
        options: field.options,
        answerCount: field.answerCount,
      });
    }

    augmented.customFields = customFields;
    return augmented;
  },
});
