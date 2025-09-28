import { Response } from "express";
import prismaClient from "../../../prismaClient";
import z from "zod";
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import {
  Metric,
  FlippedRoleMap,
  specificMatchPageMetrics,
  metricToName,
} from "../analysisConstants";
import { BargeResultReverseMap } from "../../manager/managerConstants";

import { autoPathScouter } from "./autoPathScouter";
import { averageScoutReport } from "../coreAnalysis/averageScoutReport";

export const matchPageSpecificScouter = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const params = z
      .object({
        scoutReportUuid: z.string(),
      })
      .safeParse({
        scoutReportUuid: req.params.uuid,
      });
    if (!params.success) {
      res.status(400).send(params);
      return;
    }
    const scoutReport = await prismaClient.scoutReport.findUnique({
      where: {
        uuid: params.data.scoutReportUuid,
      },
    });
    const output = {
      totalPoints: (
        await averageScoutReport(scoutReport.uuid, [Metric.totalPoints])
      )[Metric.totalPoints],
      driverAbility: scoutReport.driverAbility,
      role: FlippedRoleMap[scoutReport.robotRole],
      // stage : stageMap[scoutReport.stage],
      // highNote : highNoteMap[scoutReport.highNote],
      barge: BargeResultReverseMap[scoutReport.bargeResult],
      autoPath: await autoPathScouter(
        req.user,
        scoutReport.teamMatchKey,
        scoutReport.uuid
      ),
      note: scoutReport.notes,
      robotBrokeDescription: scoutReport.robotBrokeDescription,
      timeStamp: scoutReport.startTime,
    };

    const aggregateData = await averageScoutReport(
      scoutReport.uuid,
      specificMatchPageMetrics
    );

    for (const metric of specificMatchPageMetrics) {
      output[metricToName[metric]] = aggregateData[metric];
    }

    res.status(200).send(output);
  } catch (error) {
    console.error(error);
    res.status(400).send(error);
  }
};
