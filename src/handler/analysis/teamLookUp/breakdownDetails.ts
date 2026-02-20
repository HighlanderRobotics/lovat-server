import z from "zod";
import {
  allTeamNumbers,
  allTournaments,
  breakdownNeg,
  breakdownPos,
  dashboardToServer,
} from "../analysisConstants.js";
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
  createKey: async ({ params }) => {
    return {
      key: [
        "breakdownDetails",
        params.team.toString(),
        params.breakdown.toString(),
      ],
      teamDependencies: [params.team],
      tournamentDependencies: [],
    };
  },
  calculateAnalysis: async ({ params }, ctx) => {
    let queryStr = `
        SELECT "${dashboardToServer[params.breakdown]}" AS breakdown,
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
    const transformBreakdown = (input): string => {
      switch (input) {
        case true:
          return breakdownPos;
        case false:
          return breakdownNeg;
        default:
          return input;
      }
    };

    const parsePgArray = (input: unknown): string[] => {
      if (input == null) return [];
      if (Array.isArray(input)) return input.map(String);
      const str = String(input);
      const trimmed = str.trim();
      if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
        const inner = trimmed.slice(1, -1);
        return inner
          .split(",")
          .map((s) => s.trim().replace(/^"|"$/g, ""))
          .filter((s) => s.length > 0);
      }
      return trimmed.length ? [trimmed] : [];
    };

    const breakdownField = dashboardToServer[params.breakdown];
    const isArrayBreakdown =
      breakdownField === "robotRoles" || breakdownField === "feederTypes";

    const result: {
      key: string;
      tournamentName: string;
      breakdown: string;
      sourceTeam: string;
      scouter?: string;
    }[] = [];

    for (const match of data) {
      if (isArrayBreakdown) {
        const items = parsePgArray(match.breakdown);
        for (const item of items) {
          result.push({
            key: match.key,
            tournamentName: match.tournament,
            breakdown: item,
            sourceTeam: match.sourceteam,
            scouter: match.scouter ?? undefined,
          });
        }
      } else {
        result.push({
          key: match.key,
          tournamentName: match.tournament,
          breakdown: transformBreakdown(match.breakdown),
          sourceTeam: match.sourceteam,
          scouter: match.scouter ?? undefined,
        });
      }
    }

    return result;
  },
});
