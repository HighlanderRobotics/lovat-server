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
        teleopPoints: z.number(),
        autoPoints: z.number(),
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
        totalPoints: req.body.totalpoints || 0,
        autoPoints: req.body.autopoints || 0,
        teleopPoints: req.body.teleoppoints || 0,
        driverAbility: req.body.driverability || 0,
        climb: req.body.climbresult || 0,
        coralLevel1Scores: req.body.level1 || 0,
        coralLevel2Scores: req.body.level2 || 0,
        coralLevel3Scores: req.body.level3 || 0,
        coralLevel4Scores: req.body.level4 || 0,
        coralPickups: req.body.coralpickup || 0,
        algaeProcessor: req.body.algaeProcessor || 0,
        algaeNet: req.body.algaeNet || 0,
        algaePickups: req.body.algaePickups || 0,
        feeds: req.body.feeds || 0,
        defense: req.body.defends || 0,
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
