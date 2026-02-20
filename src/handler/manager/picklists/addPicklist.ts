import { Response } from "express";
import prismaClient from "../../../prismaClient.js";
import z from "zod";
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth.js";

export const addPicklist = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const params = z
      .object({
        authorId: z.string(),
        name: z.string(),
        totalPoints: z.number(),
        autoPoints: z.number(),
        teleopPoints: z.number(),
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
        driverAbility: z.number(),
      })
      .safeParse({
        authorId: req.user.id,
        name: req.body.name,
        totalPoints: req.body.totalPoints || 0,
        autoPoints: req.body.autoPoints || 0,
        teleopPoints: req.body.teleopPoints || 0,
        climbResult: req.body.climbResult || 0,
        autoClimb: req.body.autoClimb || 0,
        defenseEffectiveness: req.body.defenseEffectiveness || 0,
        driverAbility: req.body.driverAbility || 0,
        contactDefenseTime: req.body.contactDefenseTime || 0,
        campingDefenseTime: req.body.campingDefenseTime || 0,
        totalDefensiveTime: req.body.totalDefensiveTime || 0,
        totalFuelThroughput: req.body.totalFuelThroughput || 0,
        totalFuelFed: req.body.totalFuelFed || 0,
        feedingRate: req.body.feedingRate || 0,
        scoringRate: req.body.scoringRate || 0,
        estimatedSuccessfulFuelRate: req.body.estimatedSuccessfulFuelRate || 0,
        estimatedTotalFuelScored: req.body.estimatedTotalFuelScored || 0,
      });

    console.log({ addPicklistQuery: req.query, addPicklistBody: req.body });

    if (!params.success) {
      res.status(400).send(params);
      return;
    }
    if (req.user.teamNumber === null) {
      res
        .status(403)
        .send(
          "Not authorized to publish a picklist because you're not on a team",
        );
      return;
    }
    await prismaClient.sharedPicklist.create({
      data: {
        authorId: params.data.authorId,
        name: params.data.name,
        totalPoints: params.data.totalPoints,
        autoPoints: params.data.autoPoints,
        teleopPoints: params.data.teleopPoints,
        climbResult: params.data.climbResult,
        autoClimb: params.data.autoClimb,
        defenseEffectiveness: params.data.defenseEffectiveness,
        driverAbility: params.data.driverAbility,
        contactDefenseTime: params.data.contactDefenseTime,
        campingDefenseTime: params.data.campingDefenseTime,
        totalDefensiveTime: params.data.totalDefensiveTime,
        totalFuelThroughput: params.data.totalFuelThroughput,
        totalFuelFed: params.data.totalFuelFed,
        feedingRate: params.data.feedingRate,
        scoringRate: params.data.scoringRate,
        estimatedSuccessfulFuelRate: params.data.estimatedSuccessfulFuelRate,
        estimatedTotalFuelScored: params.data.estimatedTotalFuelScored,
      },
    });
    res.status(200).send("picklist added");
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};
