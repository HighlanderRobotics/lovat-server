import z from "zod";
import {
  allTeamNumbers,
  allTournaments,
  breakdownNeg,
  breakdownPos,
  lowercaseToBreakdown,
  MetricsBreakdown,
} from "../analysisConstants.js";
import { EventAction } from "@prisma/client";
import { createAnalysisHandler } from "../analysisHandler.js";
import {
  dataSourceRuleSchema,
  dataSourceRuleToArray,
} from "../dataSourceRule.js";
import prismaClient from "../../../prismaClient.js";

export const breakdownDetails = createAnalysisHandler({
  params: {
    params: z.object({
      team: z.preprocess((x) => Number(x), z.number()),
      breakdown: z.string(),
    }),
  },
  usesDataSource: true,
  shouldCache: true,
  createKey: ({ params }) => {
    return {
      key: [
        "breakdownDetails",
        params.team.toString(),
        lowercaseToBreakdown[params.breakdown],
      ],
      teamDependencies: [params.team],
      tournamentDependencies: [],
    };
  },
  calculateAnalysis: async ({ params }, ctx) => {
    let queryStr = `
        SELECT "${lowercaseToBreakdown[params.breakdown]}" AS breakdown,
            "teamMatchKey" AS key,
            tmnt."name" AS tournament,
            sc."sourceTeamNumber" AS sourceteam,
            teamScouter."name" AS scouter
        FROM "ScoutReport" s
        JOIN "Scouter" sc ON sc."uuid" = s."scouterUuid"
        JOIN "TeamMatchData" tmd
            ON tmd."teamNumber" = ${params.team}
            AND tmd."key" = s."teamMatchKey"
            AND sc."sourceTeamNumber" = ANY($1)
            AND tmd."tournamentKey" = ANY($2)
        JOIN "Tournament" tmnt ON tmd."tournamentKey" = tmnt."key"
        LEFT JOIN "Scouter" teamScouter
            ON teamScouter."uuid" = s."scouterUuid"
            AND teamScouter."sourceTeamNumber" = ${ctx.user.teamNumber}
        ORDER BY tmnt."date" DESC, tmd."matchType" DESC, tmd."matchNumber" DESC
        `;

    if (
      lowercaseToBreakdown[params.breakdown] === MetricsBreakdown.leavesAuto
    ) {
      queryStr = `
            SELECT
                s."teamMatchKey" AS key,
                tmnt."name" AS tournament,
                sc."sourceTeamNumber" AS sourceteam,
                teamScouter."name" AS scouter,
                CASE WHEN e."action" IS NOT NULL THEN '${breakdownPos}' ELSE '${breakdownNeg}' END AS breakdown
            FROM "ScoutReport" s
            JOIN "Scouter" sc ON sc."uuid" = s."scouterUuid"
            JOIN "TeamMatchData" tmd
                ON tmd."teamNumber" = ${params.team}
                AND tmd."key" = s."teamMatchKey"
                AND sc."sourceTeamNumber" = ANY($1)
                AND tmd."tournamentKey" = ANY($2)
            JOIN "Tournament" tmnt ON tmd."tournamentKey" = tmnt."key"
            LEFT JOIN "Event" e
                ON e."scoutReportUuid" = s."uuid"
                AND e."action" = '${EventAction.AUTO_LEAVE}'
            LEFT JOIN "Scouter" teamScouter
                ON teamScouter."uuid" = s."scouterUuid"
                AND teamScouter."sourceTeamNumber" = ${ctx.user.teamNumber}
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
      queryStr,
      dataSourceRuleToArray(
        dataSourceRuleSchema(z.number()).parse(ctx.user.teamSourceRule),
        await allTeamNumbers,
      ),
      dataSourceRuleToArray(
        dataSourceRuleSchema(z.string()).parse(ctx.user.tournamentSourceRule),
        await allTournaments,
      ),
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

    return result;
  },
});
