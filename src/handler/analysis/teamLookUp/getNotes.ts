import { Response } from "express";
import prismaClient from "../../../prismaClient";
import z from "zod";
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { getSourceFilter } from "../coreAnalysis/averageManyFast";
import { allTeamNumbers, allTournaments } from "../analysisConstants";

export const getNotes = async (
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

    let notesAndMatches: {
      notes: string;
      match: string;
      tounramentName: string; // Typo for backwards compatibility
      sourceTeam: number;
      scouterName?: string;
    }[];

    // Set up filters to decrease server load
    const sourceTnmtFilter = getSourceFilter(
      req.user.tournamentSource,
      await allTournaments,
    );
    const sourceTeamFilter = getSourceFilter(
      req.user.teamSource,
      await allTeamNumbers,
    );

    const noteData = await prismaClient.scoutReport.findMany({
      where: {
        teamMatchData: {
          teamNumber: params.data.team,
          tournamentKey: sourceTnmtFilter,
        },
        scouter: {
          sourceTeamNumber: sourceTeamFilter,
        },
        notes: {
          not: "",
        },
      },
      select: {
        notes: true,
        teamMatchKey: true,
        teamMatchData: {
          select: {
            tournament: {
              select: {
                name: true,
              },
            },
          },
        },
        scouter: {
          select: {
            sourceTeamNumber: true,
            name: Boolean(req.user.teamNumber),
          },
        },
      },
      orderBy: [
        // Ordered by most recent first
        { teamMatchData: { tournament: { date: "desc" } } },
        { teamMatchData: { matchType: "desc" } },
        { teamMatchData: { matchNumber: "desc" } },
      ],
    });

    if (Boolean(req.user.teamNumber)) {
      notesAndMatches = noteData.map((report) => ({
        notes: report.notes,
        match: report.teamMatchKey,
        tounramentName: report.teamMatchData.tournament.name,
        sourceTeam: report.scouter.sourceTeamNumber,
        scouterName:
          report.scouter.sourceTeamNumber === req.user.teamNumber
            ? report.scouter.name
            : undefined,
      }));
    } else {
      notesAndMatches = noteData.map((report) => ({
        notes: report.notes,
        match: report.teamMatchKey,
        tounramentName: report.teamMatchData.tournament.name,
        sourceTeam: report.scouter.sourceTeamNumber,
      }));
    }

    res.status(200).send(notesAndMatches);
  } catch (error) {
    console.error(error);
    res.status(400).send(error);
  }
};
