import { Response } from "express";
import z from "zod";
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { metricsCategory, metricToName } from "../analysisConstants";
import { averageManyFast } from "../coreAnalysis/averageManyFast";

export const categoryMetrics = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const params = z
      .object({
        team: z.number(),
      })
      .safeParse({
        team: Number(req.params.team),
      });
    if (!params.success) {
      res.status(400).send(params);
      return;
    }
    const result = {};

    //update if statments in arrayAndAverage if the metric needs to look at scoutReport instead of events table
    const data = await averageManyFast(
      [params.data.team],
      metricsCategory,
      req.user,
    );

    for (const metric of metricsCategory) {
      result[metricToName[metric]] = data[metric][params.data.team];
    }

    res.status(200).send(result);
  } catch (error) {
    console.error(error);
    res.status(400).send(error);
  }
};
