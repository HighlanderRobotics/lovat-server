import { Response } from "express";
import prismaClient from "../../prismaClient";
import z from "zod";
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";
import { checkScouterShiftMatches } from "./checkScouterShiftMatches";
import { checkOnlyOneInstanceOfScouter } from "./checkOnlyInstanceOfScouter";

export const updateScouterShift = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const params = z
      .object({
        startMatchOrdinalNumber: z.number(),
        endMatchOrdinalNumber: z.number(),
        team1: z.array(z.string()),
        team2: z.array(z.string()),
        team3: z.array(z.string()),
        team4: z.array(z.string()),
        team5: z.array(z.string()),
        team6: z.array(z.string()),
        uuid: z.string(),
      })
      .safeParse({
        startMatchOrdinalNumber: req.body.startMatchOrdinalNumber,
        endMatchOrdinalNumber: req.body.endMatchOrdinalNumber,
        team1: req.body.team1,
        team2: req.body.team2,
        team3: req.body.team3,
        team4: req.body.team4,
        team5: req.body.team5,
        team6: req.body.team6,
        uuid: req.params.uuid,
      });
    if (!params.success) {
      res.status(400).send(params);
      return;
    }
    const tournamentRow = await prismaClient.scouterScheduleShift.findUnique({
      where: {
        uuid: params.data.uuid,
      },
    });
    const scoutersUnique = await checkOnlyOneInstanceOfScouter(
      params.data.team1,
      params.data.team2,
      params.data.team3,
      params.data.team4,
      params.data.team5,
      params.data.team6,
    );
    if (!scoutersUnique) {
      res.status(400).send({
        error: "Overlapping scouters in one shift",
        displayError:
          "Overlapping scouters, please make sure each scouter is scheduled only once.",
      });
      return;
    }
    const matchesNotOverlapping = await checkScouterShiftMatches(
      req,
      tournamentRow.tournamentKey,
      params.data.startMatchOrdinalNumber,
      params.data.endMatchOrdinalNumber,
      params.data.uuid,
    );
    if (!matchesNotOverlapping) {
      res.status(400).send({
        error: "This shifts start or end match overlaps with another shift.",
        displayError:
          "This shifts start or end match overlaps with another shift.",
      });
      return;
    }
    if (req.user.role === "SCOUTING_LEAD") {
      const rows = await prismaClient.scouterScheduleShift.update({
        where: {
          uuid: params.data.uuid,
        },
        data: {
          startMatchOrdinalNumber: params.data.startMatchOrdinalNumber,
          endMatchOrdinalNumber: params.data.endMatchOrdinalNumber,
          team1: {
            set: [],
            connect: params.data.team1.map((uuid) => ({ uuid })),
          },
          team2: {
            set: [],
            connect: params.data.team2.map((uuid) => ({ uuid })),
          },
          team3: {
            set: [],
            connect: params.data.team3.map((uuid) => ({ uuid })),
          },
          team4: {
            set: [],
            connect: params.data.team4.map((uuid) => ({ uuid })),
          },
          team5: {
            set: [],
            connect: params.data.team5.map((uuid) => ({ uuid })),
          },
          team6: {
            set: [],
            connect: params.data.team6.map((uuid) => ({ uuid })),
          },
          sourceTeamNumber: req.user.teamNumber,
        },
      });

      if (!rows) {
        res
          .status(404)
          .send(
            "Cannot find scouter shift or not on the team of the shift you are trying to edit",
          );
        return;
      }
      res.status(200).send("Scouter shift updated successfully");
    } else {
      res.status(403).send("Unauthorized to delete this picklist");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Error in deleting data");
  }
};
