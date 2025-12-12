import { Response } from "express";
import prismaClient from "../../prismaClient.js";
import z from "zod";
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth.js";
import { allTeamNumbers } from "../analysis/analysisConstants.js";
import { arrayToRule } from "../../lib/migrateDataSources.js";

export const addTeamSource = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const user = req.user;
    if (req.body.mode === "ALL_TEAMS") {
      await prismaClient.user.update({
        where: {
          id: user.id,
        },
        data: {
          teamSourceRule: { mode: "EXCLUDE", items: [] },
        },
      });
      res.status(200).send("team sources added");
      return;
    } else if (req.body.mode === "THIS_TEAM") {
      if (user.teamNumber === null) {
        res.status(403).send("Not affliated with a team");
        return;
      } else {
        await prismaClient.user.update({
          where: {
            id: user.id,
          },
          data: {
            teamSourceRule: { mode: "INCLUDE", items: [user.teamNumber] },
          },
        });
        res.status(200).send("team sources added");
        return;
      }
    } else {
      const params = z
        .object({
          teamSource: z.array(z.number()),
        })
        .safeParse({
          teamSource: req.body.teams,
        });

      if (!params.success) {
        res.status(400).send(params);
        return;
      }
      await prismaClient.user.update({
        where: {
          id: user.id,
        },
        data: {
          teamSourceRule: arrayToRule<number>(
            params.data.teamSource,
            await allTeamNumbers,
          ),
        },
      });
      res.status(200).send("team sources added");
      return;
    }
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};
