import { Response } from "express";
import z from "zod";
import prismaClient from "../../../prismaClient";
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import {
  breakdownNeg,
  breakdownPos,
  lowercaseToBreakdown,
  MetricsBreakdown,
} from "../analysisConstants";
import { EventAction } from "@prisma/client";

export const breakdownDetails = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const params = z
      .object({
        team: z.number(),
        breakdown: z.nativeEnum(MetricsBreakdown),
      })
      .safeParse({
        team: Number(req.params.team),
        breakdown: lowercaseToBreakdown[req.params.breakdown],
      });
    if (!params.success) {
      console.log(params);
      res.status(400).send(params);
      return;
    }

    let query = `
        SELECT "${params.data.breakdown}" AS breakdown,
            "teamMatchKey" AS key,
            tmnt."name" AS tournament,
            sc."sourceTeamNumber" AS sourceteam,
            teamScouter."name" AS scouter
        FROM "ScoutReport" s
        JOIN "Scouter" sc ON sc."uuid" = s."scouterUuid"
        JOIN "TeamMatchData" tmd
            ON tmd."teamNumber" = ${params.data.team}
            AND tmd."key" = s."teamMatchKey"
            AND sc."sourceTeamNumber" = ANY($1)
            AND tmd."tournamentKey" = ANY($2)
        JOIN "Tournament" tmnt ON tmd."tournamentKey" = tmnt."key"
        LEFT JOIN "Scouter" teamScouter
            ON teamScouter."uuid" = s."scouterUuid"
            AND teamScouter."sourceTeamNumber" = ${req.user.teamNumber}
        ORDER BY tmnt."date" DESC, tmd."matchType" DESC, tmd."matchNumber" DESC
        `;

    if (params.data.breakdown === MetricsBreakdown.leavesAuto) {
      query = `
            SELECT
                s."teamMatchKey" AS key,
                tmnt."name" AS tournament,
                sc."sourceTeamNumber" AS sourceteam,
                teamScouter."name" AS scouter,
                CASE WHEN e."action" IS NOT NULL THEN '${breakdownPos}' ELSE '${breakdownNeg}' END AS breakdown
            FROM "ScoutReport" s
            JOIN "Scouter" sc ON sc."uuid" = s."scouterUuid"
            JOIN "TeamMatchData" tmd
                ON tmd."teamNumber" = ${params.data.team}
                AND tmd."key" = s."teamMatchKey"
                AND sc."sourceTeamNumber" = ANY($1)
                AND tmd."tournamentKey" = ANY($2)
            JOIN "Tournament" tmnt ON tmd."tournamentKey" = tmnt."key"
            LEFT JOIN "Event" e
                ON e."scoutReportUuid" = s."uuid"
                AND e."action" = '${EventAction.AUTO_LEAVE}'
            LEFT JOIN "Scouter" teamScouter
                ON teamScouter."uuid" = s."scouterUuid"
                AND teamScouter."sourceTeamNumber" = ${req.user.teamNumber}
            ORDER BY tmnt."date" DESC, tmd."matchType" DESC, tmd."matchNumber" DESC
            `;
    }

    interface QueryRow {
      breakdown: string;
      key: string;
      tournament: string;
      sourceteam: string;
      scouter: string;
    }

    const data = await prismaClient.$queryRawUnsafe<QueryRow[]>(
      query,
      req.user.teamSource,
      req.user.tournamentSource
    );

    // Edit to work with true/false breakdowns
    const transformBreakdown = (input: string): string => {
      switch (input) {
        case "YES":
          return breakdownPos;
        case "NO":
          return breakdownNeg;
        default:
          return input;
      }
    };

    const result: {
      key: string;
      tournamentName: string;
      breakdown: string;
      sourceTeam: string;
      scouter?: string;
    }[] = [];
    for (const match of data) {
      result.push({
        key: match.key,
        tournamentName: match.tournament,
        breakdown: transformBreakdown(match.breakdown),
        sourceTeam: match.sourceteam,
        scouter: match.scouter ?? undefined,
      });
    }

    res.status(200).send(result);
  } catch (error) {
    console.error(error);
    res.status(400).send(error);
  }
};
