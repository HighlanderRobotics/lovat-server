import z from "zod";
import { CustomFieldType } from "@prisma/client";
import prismaClient from "../../../prismaClient.js";
import { autoPathsTeam } from "../autoPaths/autoPathsTeam.js";
import { averageAllTeamFast } from "../coreAnalysis/averageAllTeamFast.js";
import { Metric, metricsToNumber } from "../analysisConstants.js";
import { arrayAndAverageTeams } from "../coreAnalysis/arrayAndAverageTeams.js";
import { createAnalysisHandler } from "../analysisHandler.js";
import {
  customFieldNumberAll,
  customFieldNumberTeams,
} from "../customFields/customFieldNumberAverages.js";
import { parseCfKey } from "../customFields/customFieldShared.js";

export const detailsPage = createAnalysisHandler({
  params: {
    params: z.object({
      team: z.preprocess((x) => Number(x), z.number()),
      metric: z.string(),
      tournament: z.string().optional(),
    }),
  },
  usesDataSource: true,
  shouldCache: true,
  createKey: async ({ params }, ctx) => {
    const key = ["detailsPage", params.team.toString(), params.metric.toString()];
    const teamDependencies = [params.team];

    // cf_ metrics are viewer-scoped: fragment the key by viewer team (no key
    // change at all for ordinary metrics) and depend on the viewer team so
    // custom field config mutations invalidate the row.
    if (parseCfKey(params.metric) !== null) {
      key.push(`viewer${ctx.user.teamNumber ?? "none"}`);
      if (
        ctx.user.teamNumber !== null &&
        ctx.user.teamNumber !== undefined &&
        !teamDependencies.includes(ctx.user.teamNumber)
      ) {
        teamDependencies.push(ctx.user.teamNumber);
      }
    }

    return {
      key: key,
      teamDependencies: teamDependencies,
      tournamentDependencies: [],
    };
  },
  calculateAnalysis: async ({ params }, ctx) => {
    const cfUuid = parseCfKey(params.metric);
    if (cfUuid !== null) {
      // Ownership check: the field must belong to the viewer's team and be a
      // NUMBER field. Archived fields still resolve so old links keep working.
      const viewerTeam = ctx.user.teamNumber;
      if (viewerTeam === null || viewerTeam === undefined) {
        return { error: "METRIC_DOES_NOT_EXIST" };
      }

      const field = await prismaClient.customField.findUnique({
        where: { uuid: cfUuid },
      });
      if (
        !field ||
        field.teamNumber !== viewerTeam ||
        field.type !== CustomFieldType.NUMBER
      ) {
        return { error: "METRIC_DOES_NOT_EXIST" };
      }

      const teamData = (
        await customFieldNumberTeams(ctx.user, {
          viewerTeam: viewerTeam,
          teams: [params.team],
          fieldUuid: cfUuid,
        })
      )[String(params.team)];
      const allTeamAverage = await customFieldNumberAll(ctx.user, {
        viewerTeam: viewerTeam,
        fieldUuid: cfUuid,
      });

      // Match existing metrics: teams/fields with no data report 0
      const resultValue = teamData?.average ?? 0;
      const allValue = allTeamAverage ?? 0;
      return {
        array: teamData?.timeLine ?? [],
        result: resultValue,
        all: allValue,
        difference: resultValue - allValue,
        team: params.team,
        customField: {
          uuid: field.uuid,
          name: field.name,
          archived: field.archived,
        },
      };
    }

    if (metricsToNumber[params.metric] === Metric.autoPoints) {
      const autoPaths = await autoPathsTeam(ctx.user, { team: params.team });
      return { paths: autoPaths };
    } else {
      const metricEnum = metricsToNumber[params.metric] as Metric;
      const teamAverageAndTimeLine = (
        await arrayAndAverageTeams(ctx.user, {
          teams: [params.team],
          metric: metricEnum,
        })
      )[params.team];
      const allTeamAverage = (await averageAllTeamFast(ctx.user, {
        metric: metricEnum,
      })) as number;
      const timeLine = teamAverageAndTimeLine.timeLine;
      const resultValue = teamAverageAndTimeLine.average;
      const result = {
        array: timeLine,
        result: resultValue,
        all: allTeamAverage,
        difference: resultValue - allTeamAverage,
        team: params.team,
      };
      return result;
    }
  },
});
