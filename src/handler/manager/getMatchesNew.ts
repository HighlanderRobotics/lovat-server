import { Response } from "express";
import prismaClient from "../../prismaClient.js";
import z from "zod";
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth.js";
import { addTournamentMatches } from "./addTournamentMatches.js";
import { ReverseMatchTypeMap } from "./managerConstants.js";
import { MatchType, Prisma } from "@prisma/client";
import { swrConstant, ttlConstant } from "../analysis/analysisConstants.js";
import {
  dataSourceRuleSchema,
  dataSourceRuleToPrismaFilter,
} from "../analysis/dataSourceRule.js";

/**
 * @param params.tournament tournament to pull from
 * @param query.teams optional - limit to matches containing all these teams
 *
 * @returns list of matches organized by number and type, with data for teams/scouts/external reports
 */
export const getMatches = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const user = req.user;
    let teams = null;
    if (req.query.teams != undefined) {
      teams = JSON.parse(req.query.teams as string);
    }
    const params = z
      .object({
        tournamentKey: z.string(),
        teamFilter: z.array(z.number()).nullable(),
      })
      .safeParse({
        tournamentKey: req.params.tournament,
        teamFilter: teams,
      });
    if (!params.success) {
      res.status(400).send(params);
      return;
    }

    if (params.data.teamFilter && params.data.teamFilter.length > 6) {
      res.status(400).send("Too many team filters");
      return;
    }

    // Check that matches from a tournament exist; if not, add them
    const matchRow = await prismaClient.teamMatchData.findFirst({
      where: {
        tournamentKey: params.data.tournamentKey,
      },
    });
    if (!matchRow) {
      await addTournamentMatches(params.data.tournamentKey);
    }

    // Assuming all elimination matches are not scouted, find the last scouted match (and pretend it is the last completed one)
    const last = await prismaClient.teamMatchData.findFirst({
      where: {
        tournamentKey: params.data.tournamentKey,
        matchType: MatchType.QUALIFICATION,
        scoutReports: {
          some: {},
        },
      },
      orderBy: [{ matchNumber: "desc" }],
      select: {
        matchNumber: true,
      },
    });
    // Default to 0
    const lastFinishedMatch = last ? last.matchNumber : 0;

    // Filter to return a list of user's team's scout reports for each row, only valid if user has a team number
    let includeTeamReports: Prisma.TeamMatchData$scoutReportsArgs | undefined =
      undefined;

    const teamSourceRule = dataSourceRuleSchema(z.number()).parse(
      req.user.teamSourceRule,
    );

    if (user.teamNumber) {
      // make sure the user's teamSourceRule has their own team included
      if (teamSourceRule.mode === "EXCLUDE") {
        // if their source rule is exclude, make sure the user's team number isn't in items
        teamSourceRule.items = teamSourceRule.items.filter(
          (item) => item !== user.teamNumber,
        );
      } else if (
        // if their mode is include, make sure the user's team number is on their list of items
        teamSourceRule.mode === "INCLUDE" &&
        !teamSourceRule.items.includes(user.teamNumber)
      ) {
        teamSourceRule.items.push(user.teamNumber);
      }

      includeTeamReports = {
        where: {
          scouter: {
            sourceTeamNumber: user.teamNumber,
          },
        },
        select: {
          scouter: {
            select: {
              name: true,
              uuid: true,
            },
          },
        },
      };
    }

    const rawData = await prismaClient.teamMatchData.findMany({
      cacheStrategy: {
        swr: swrConstant,
        ttl: ttlConstant,
      },
      where: {
        tournamentKey: params.data.tournamentKey,
      },
      select: {
        matchNumber: true,
        matchType: true,
        teamNumber: true,
        key: true,
        _count: {
          // Represents the total number of valid scout reports for this row
          select: {
            scoutReports: {
              where: {
                scouter: {
                  sourceTeamNumber:
                    dataSourceRuleToPrismaFilter(teamSourceRule),
                },
              },
            },
          },
        },
        scoutReports: includeTeamReports,
      },
    });

    /*
     * SELECT matchNumber, matchType, teamNumber, key
     * (SELECT COUNT(*)
     *     FROM scoutReports
     *     WHERE scouter.sourceTeamNumber IN (${[9143, 8033].join(",")})) AS _reports
     * (SELECT COUNT(*)
     *     FROM scoutReports
     *     WHERE (NOT scouter.sourceTeamNumber = (${9143}))
     *         AND (scouter.sourceTeamNumber IN (${[9143, 8033].join(",")}))) AS _external
     * FROM TeamMatchData
     *     WHERE tournamentKey = ${"2024casf"};
     */

    // Group data by match (first layer, elimination matches are negative indices) and team (second layer, 0-5)
    // !!!IMPORTANT: the scoutReports property only exists if user.teamNumber exists
    let groupedData: {
      matchNumber: number;
      teamNumber: number;
      matchType: MatchType;
      key: string;
      _count: { scoutReports: number };
      scoutReports: { scouter: { name: string; uuid: string } }[] | undefined;
    }[][] = rawData.reduce((acc, curr) => {
      // Positive indices are quals, negatives are elims
      const i =
        curr.matchNumber * (curr.matchType === MatchType.ELIMINATION ? -1 : 1);
      acc[i] ??= [];
      // Order match by team index [0-5]
      acc[i][Number(curr.key.at(-1))] = curr;
      return acc;
    }, []);

    const lastQualMatch = groupedData.length - 1;

    // If team filters are set, limit matches to those including all selected teams
    if (params.data.teamFilter && params.data.teamFilter.length > 0) {
      const tempArray: typeof groupedData = [];

      // For..in to iterate over positive and negative properties
      for (const k in groupedData) {
        const i = parseInt(k);
        const match = groupedData[i];
        if (
          params.data.teamFilter.every((requiredTeam) =>
            match.find((team) => team.teamNumber === requiredTeam),
          )
        ) {
          // Check that all required teams are included in a match
          tempArray[i] = match;
        }
      }

      groupedData = tempArray;
    }

    // Fetch data for matches and attach scouted and finished flags
    const finalFormattedMatches: {
      matchNumber: number;
      matchType: number;
      scouted: boolean;
      finished: boolean;
      team1: {
        number: number;
        scouters: { name: string; scouted: boolean }[];
        externalReports: number;
      };
      team2: {
        number: number;
        scouters: { name: string; scouted: boolean }[];
        externalReports: number;
      };
      team3: {
        number: number;
        scouters: { name: string; scouted: boolean }[];
        externalReports: number;
      };
      team4: {
        number: number;
        scouters: { name: string; scouted: boolean }[];
        externalReports: number;
      };
      team5: {
        number: number;
        scouters: { name: string; scouted: boolean }[];
        externalReports: number;
      };
      team6: {
        number: number;
        scouters: { name: string; scouted: boolean }[];
        externalReports: number;
      };
    }[] = [];

    // If no team number is set, there are no scouters and all reports are external
    if (!user.teamNumber) {
      for (const k in groupedData) {
        const i = parseInt(k);
        const match = groupedData[i];
        const currData = {
          matchNumber: match[0].matchNumber,
          matchType: ReverseMatchTypeMap[match[0].matchType],
          scouted: match.some((team) => team._count.scoutReports >= 1),
          finished:
            match[0].matchType === MatchType.QUALIFICATION &&
            match[0].matchNumber <= lastFinishedMatch,
          team1: {
            number: match[0].teamNumber,
            scouters: [],
            externalReports: match[0]._count.scoutReports,
          },
          team2: {
            number: match[1].teamNumber,
            scouters: [],
            externalReports: match[1]._count.scoutReports,
          },
          team3: {
            number: match[2].teamNumber,
            scouters: [],
            externalReports: match[2]._count.scoutReports,
          },
          team4: {
            number: match[3].teamNumber,
            scouters: [],
            externalReports: match[3]._count.scoutReports,
          },
          team5: {
            number: match[4].teamNumber,
            scouters: [],
            externalReports: match[4]._count.scoutReports,
          },
          team6: {
            number: match[5].teamNumber,
            scouters: [],
            externalReports: match[5]._count.scoutReports,
          },
        };

        // Index = ordinal match number, 0 indexed
        if (i > 0) {
          finalFormattedMatches[i - 1] = currData;
        } else {
          finalFormattedMatches[lastQualMatch - i - 1] = currData;
        }
      }

      res.status(200).send(finalFormattedMatches);
      return;
    }
    // Done here if user has no team number

    const scouterShifts = await prismaClient.scouterScheduleShift.findMany({
      where: {
        tournamentKey: params.data.tournamentKey,
        sourceTeamNumber: user.teamNumber,
      },
      orderBy: [{ startMatchOrdinalNumber: "asc" }],
      select: {
        startMatchOrdinalNumber: true,
        endMatchOrdinalNumber: true,
        team1: { select: { name: true, uuid: true } },
        team2: { select: { name: true, uuid: true } },
        team3: { select: { name: true, uuid: true } },
        team4: { select: { name: true, uuid: true } },
        team5: { select: { name: true, uuid: true } },
        team6: { select: { name: true, uuid: true } },
      },
    });

    let currShiftIndex = 0;
    // For..in should iterate through array indices first, then other properties by insertion order
    for (const k in groupedData) {
      const i = parseInt(k);
      const match = groupedData[i];
      const ordinalMatchNumber = i > 0 ? i : lastQualMatch - i;

      // Increment the scouter shift if we passed the upper bound
      if (
        scouterShifts[currShiftIndex] &&
        ordinalMatchNumber > scouterShifts[currShiftIndex].endMatchOrdinalNumber
      ) {
        currShiftIndex++;
      }

      const matchScouters: { name: string; scouted: boolean }[][] = [];
      for (let j = 0; j < 6; j++) {
        // Add all complete scout reports from user's team
        matchScouters[j] = match[j].scoutReports.map((e) => ({
          name: e.scouter.name,
          scouted: true,
        }));

        // If the current match number is within a scouter shift, add incomplete scout reports
        if (
          scouterShifts[currShiftIndex] &&
          ordinalMatchNumber >=
            scouterShifts[currShiftIndex].startMatchOrdinalNumber
        ) {
          // Sketchy but iterates through team1-6, could cause problems if schema is changed
          for (const currScouter of scouterShifts[currShiftIndex][
            `team${j + 1}`
          ]) {
            // If the sourced scout reports do not include ones from the shift, add those as incomplete
            if (
              !match[j].scoutReports.some(
                (e) => e.scouter.uuid === currScouter.uuid,
              )
            ) {
              matchScouters[j].push({ name: currScouter.name, scouted: false });
            }
          }
        }
      }

      // Scouted flag based on if any team in this match has at least 1 sourced scout report
      // Finished flag is true if the match is a qualification before the last finished match
      // Scouters array includes all scouters from user's team, and all incomplete reports from assigned scouting shifts
      // External reports are the number of non-team scout reports, so [other team reports - user team reports]
      const currData = {
        matchNumber: match[0].matchNumber,
        matchType: ReverseMatchTypeMap[match[0].matchType],
        scouted: match.some((team) => team._count.scoutReports >= 1),
        finished:
          match[0].matchType === MatchType.QUALIFICATION &&
          match[0].matchNumber <= lastFinishedMatch,
        team1: {
          number: match[0].teamNumber,
          scouters: matchScouters[0],
          externalReports:
            match[0]._count.scoutReports - match[0].scoutReports.length,
        },
        team2: {
          number: match[1].teamNumber,
          scouters: matchScouters[1],
          externalReports:
            match[1]._count.scoutReports - match[1].scoutReports.length,
        },
        team3: {
          number: match[2].teamNumber,
          scouters: matchScouters[2],
          externalReports:
            match[2]._count.scoutReports - match[2].scoutReports.length,
        },
        team4: {
          number: match[3].teamNumber,
          scouters: matchScouters[3],
          externalReports:
            match[3]._count.scoutReports - match[3].scoutReports.length,
        },
        team5: {
          number: match[4].teamNumber,
          scouters: matchScouters[4],
          externalReports:
            match[4]._count.scoutReports - match[4].scoutReports.length,
        },
        team6: {
          number: match[5].teamNumber,
          scouters: matchScouters[5],
          externalReports:
            match[5]._count.scoutReports - match[5].scoutReports.length,
        },
      };

      // Ordered by ordinal match number, 0 indexed
      finalFormattedMatches[ordinalMatchNumber - 1] = currData;
    }

    if (!params.data.teamFilter) {
      res.status(200).send(finalFormattedMatches);
      return;
    }

    // If teams are filtered, the array will be sparse and has to be condensed
    const denseFormattedMatches: typeof finalFormattedMatches = [];
    if (params.data.teamFilter) {
      for (const match of finalFormattedMatches) {
        if (match) {
          denseFormattedMatches.push(match);
        }
      }
    }

    res.status(200).send(denseFormattedMatches);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};
