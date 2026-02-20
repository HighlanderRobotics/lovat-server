import { Response } from "express";
import prismaClient from "../../../prismaClient.js";
import z from "zod";
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth.js";

export const getSinglePicklist = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const user = req.user;

    const params = z
      .object({
        uuid: z.string(),
      })
      .safeParse({
        uuid: req.params.uuid,
      });
    if (!params.success) {
      res.status(400).send(params);
      return;
    }

    const row = await prismaClient.sharedPicklist.findUnique({
      where: {
        author: {
          teamNumber: user.teamNumber,
        },
        uuid: params.data.uuid,
      },
    });

    // Map picklist rows to accepted names
    const out = {
      uuid: row.uuid,
      name: row.name,
      authorId: row.authorId,
      totalPoints: row.totalPoints,
      autoPoints: row.autoPoints,
      teleopPoints: row.teleopPoints,
      climbResult: row.climbResult,
      autoClimb: row.autoClimb,
      defenseEffectiveness: row.defenseEffectiveness,
      contactDefenseTime: row.contactDefenseTime,
      campingDefenseTime: row.campingDefenseTime,
      totalDefensiveTime: row.totalDefensiveTime,
      totalFuelThroughput: row.totalFuelThroughput,
      totalFuelFed: row.totalFuelFed,
      feedingRate: row.feedingRate,
      scoringRate: row.scoringRate,
      estimatedSuccessfulFuelRate: row.estimatedSuccessfulFuelRate,
      estimatedTotalFuelScored: row.estimatedTotalFuelScored,
    };

    res.status(200).send(out);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};
