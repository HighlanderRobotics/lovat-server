import { Response } from "express";
import prismaClient from "../../../prismaClient.js";
import z from "zod";
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth.js";

export const updatePicklist = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const user = req.user;
    const params = z
      .object({
        name: z.string(),
        totalPoints: z.number(),
        autoPoints: z.number(),
        teleopPoints: z.number(),
        driverAbility: z.number(),
        climbResult: z.number(),
        autoClimb: z.number(),
        defenseEffectiveness: z.number(),
        contactDefenseTime: z.number(),
        campingDefenseTime: z.number(),
        totalDefensiveTime: z.number(),
        totalFuelThroughput: z.number(),
        totalFuelFed: z.number(),
        feedingRate: z.number(),
        scoringRate: z.number(),
        estimatedSuccessfulFuelRate: z.number(),
        estimatedTotalFuelScored: z.number(),
        authorId: z.string(),
      })
      .safeParse({
        name: req.body.name,
        totalPoints: req.body.totalPoints || 0,
        autoPoints: req.body.autoPoints || 0,
        teleopPoints: req.body.teleopPoints || 0,
        driverAbility: req.body.driverAbility || 0,
        climbResult: req.body.climbResult || 0,
        autoClimb: req.body.autoClimb || 0,
        defenseEffectiveness: req.body.defenseEffectiveness || 0,
        contactDefenseTime: req.body.contactDefenseTime || 0,
        campingDefenseTime: req.body.campingDefenseTime || 0,
        totalDefensiveTime: req.body.totalDefensiveTime || 0,
        totalFuelThroughput: req.body.totalFuelThroughput || 0,
        totalFuelFed: req.body.totalFuelFed || 0,
        feedingRate: req.body.feedingRate || 0,
        scoringRate: req.body.scoringRate || 0,
        estimatedSuccessfulFuelRate: req.body.estimatedSuccessfulFuelRate || 0,
        estimatedTotalFuelScored: req.body.estimatedTotalFuelScored || 0,
        authorId: user.id,
      });

    console.log({ addPicklistQuery: req.query, addPicklistBody: req.body });

    if (!params.success) {
      res.status(400).send(params);
      return;
    }
    const row = await prismaClient.sharedPicklist.update({
      where: {
        uuid: req.params.uuid,
        author: {
          teamNumber: user.teamNumber,
        },
      },
      data: {
        name: params.data.name,
        totalPoints: params.data.totalPoints,
        autoPoints: params.data.autoPoints,
        teleopPoints: params.data.teleopPoints,
        driverAbility: params.data.driverAbility,
        climbResult: params.data.climbResult,
        autoClimb: params.data.autoClimb,
        defenseEffectiveness: params.data.defenseEffectiveness,
        contactDefenseTime: params.data.contactDefenseTime,
        campingDefenseTime: params.data.campingDefenseTime,
        totalDefensiveTime: params.data.totalDefensiveTime,
        totalFuelThroughput: params.data.totalFuelThroughput,
        totalFuelFed: params.data.totalFuelFed,
        feedingRate: params.data.feedingRate,
        scoringRate: params.data.scoringRate,
        estimatedSuccessfulFuelRate: params.data.estimatedSuccessfulFuelRate,
        estimatedTotalFuelScored: params.data.estimatedTotalFuelScored,
        authorId: params.data.authorId,
      },
    });
    if (!row) {
      res.status(403).send("Not authorized to update this picklist");
      return;
    }
    res.status(200).send("picklist updated");
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};
