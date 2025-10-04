import { Response } from "express";
import prismaClient from "../../prismaClient";
import z from "zod";
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";
import { UserRole } from "@prisma/client";
import { checkOnlyOneInstanceOfScouter } from "./checkOnlyInstanceOfScouter";
import { checkScouterShiftMatches } from "./checkScouterShiftMatches";

export const addScouterShift = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const params = z
      .object({
        sourceTeamNumber: z.number(),
        tournamentKey: z.string(),
        startMatchOrdinalNumber: z.number(),
        endMatchOrdinalNumber: z.number(),
        team1: z.array(z.string()),
        team2: z.array(z.string()),
        team3: z.array(z.string()),
        team4: z.array(z.string()),
        team5: z.array(z.string()),
        team6: z.array(z.string()),
      })
      .safeParse({
        sourceTeamNumber: req.user.teamNumber,
        tournamentKey: req.params.tournament,
        startMatchOrdinalNumber: req.body.startMatchOrdinalNumber,
        endMatchOrdinalNumber: req.body.endMatchOrdinalNumber,
        team1: req.body.team1,
        team2: req.body.team2,
        team3: req.body.team3,
        team4: req.body.team4,
        team5: req.body.team5,
        team6: req.body.team6,
      });
    if (!params.success) {
      res.status(400).send(params);
      return;
    }
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
      params.data.tournamentKey,
      params.data.startMatchOrdinalNumber,
      params.data.endMatchOrdinalNumber,
    );
    if (!matchesNotOverlapping) {
      res.status(400).send({
        error: "This shifts start or end match overlaps with another shift.",
        displayError:
          "This shifts start or end match overlaps with another shift.",
      });
      return;
    }

    if (req.user.role === UserRole.SCOUTING_LEAD) {
      await prismaClient.scouterScheduleShift.create({
        data: {
          sourceTeamNumber: params.data.sourceTeamNumber,
          tournamentKey: params.data.tournamentKey,
          startMatchOrdinalNumber: params.data.startMatchOrdinalNumber,
          endMatchOrdinalNumber: params.data.endMatchOrdinalNumber,
          team1: { connect: params.data.team1.map((uuid) => ({ uuid })) },
          team2: { connect: params.data.team2.map((uuid) => ({ uuid })) },
          team3: { connect: params.data.team3.map((uuid) => ({ uuid })) },
          team4: { connect: params.data.team4.map((uuid) => ({ uuid })) },
          team5: { connect: params.data.team5.map((uuid) => ({ uuid })) },
          team6: { connect: params.data.team6.map((uuid) => ({ uuid })) },
        },
      });
      res.status(200).send("done adding scouter shift");
    } else {
      res.status(403).send("Not authorized to add scouter shift");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};
