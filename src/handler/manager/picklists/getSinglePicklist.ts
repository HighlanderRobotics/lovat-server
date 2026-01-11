import { Response } from "express";
import prismaClient from "../../../prismaClient.js";
import z from "zod";
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth.js";

export const getSinglePicklist = async (
  req: AuthenticatedRequest,
  res: Response
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
      totalpoints: row.totalPoints,
      autopoints: row.autoPoints,
      teleoppoints: row.teleopPoints,
      driverability: row.driverAbility,
      climbresult: row.climb,
      level1: row.coralLevel1Scores,
      level2: row.coralLevel2Scores,
      level3: row.coralLevel3Scores,
      level4: row.coralLevel4Scores,
      coralpickup: row.coralPickups,
      algaeProcessor: row.algaeProcessor,
      algaeNet: row.algaeNet,
      algaePickups: row.algaePickups,
      feeds: row.feeds,
      defends: row.defense,
    };

    res.status(200).send(out);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};
