import prismaClient from "../../../prismaClient.js";
import {
  autoEnd,
  endgameToPoints,
  Metric,
  metricToEvent,
  swrConstant,
  ttlConstant,
  allTournaments,
} from "../analysisConstants.js";
import { ClimbResult, Position, Prisma } from "@prisma/client";
import { endgameRuleOfSuccession } from "../picklist/endgamePicklistTeamFast.js";
import { Event } from "@prisma/client";
import { weightedTourAvgLeft } from "./arrayAndAverageTeams.js";
import z from "zod";
import {
  dataSourceRuleToPrismaFilter,
  dataSourceRuleSchema,
} from "../dataSourceRule.js";
import { runAnalysis, AnalysisFunctionConfig } from "../analysisFunction.js";
import { User } from "@prisma/client";

export interface ArrayFilter<T> {
  notIn?: T[];
  in?: T[];
}

const argsSchema = z.object({
  teams: z.array(z.number()),
  metrics: z.array(z.nativeEnum(Metric)),
});

const config: AnalysisFunctionConfig<typeof argsSchema, z.ZodType> = {
  argsSchema,
  returnSchema: z.record(z.string(), z.record(z.string(), z.number())),
  usesDataSource: true,
  shouldCache: true,
  createKey: (args) => {
    return {
      key: [
        "averageManyFast",
        JSON.stringify(args.teams.sort((a, b) => a - b)),
        JSON.stringify(args.metrics.map(String).sort()),
      ],
      teamDependencies: args.teams,
      tournamentDependencies: [],
    };
  },
  calculateAnalysis: async (
    args: z.infer<typeof argsSchema>,
    ctx: { user: User }
  ) => {
    const sourceTnmtFilter = dataSourceRuleToPrismaFilter<string>(
      dataSourceRuleSchema(z.string()).parse(ctx.user.tournamentSourceRule)
    );
    const sourceTeamFilter = dataSourceRuleToPrismaFilter<number>(
      dataSourceRuleSchema(z.number()).parse(ctx.user.teamSourceRule)
    );

    const tmdFilter: Prisma.TeamMatchDataWhereInput = {
      teamNumber: { in: args.teams },
    };
    if (sourceTnmtFilter) {
      tmdFilter.tournamentKey = sourceTnmtFilter;
    }
    const srFilter: Prisma.ScoutReportWhereInput = {};
    if (sourceTeamFilter) {
      srFilter.scouter = {
        sourceTeamNumber: sourceTeamFilter,
      };
    }

    const tmd = await prismaClient.teamMatchData.findMany({
      cacheStrategy: { swr: swrConstant, ttl: ttlConstant },
      where: tmdFilter,
      select: {
        tournamentKey: true,
        teamNumber: true,
        scoutReports: {
          where: srFilter,
          select: {
            events: {
              select: {
                action: true,
                position: true,
                points: true,
                time: true,
              },
            },
            driverAbility: true,
            climbResult: true,
          },
        },
      },
    });

    interface GroupedData {
      tournamentData: {
        srEvents: Partial<Event>[][];
        driverAbility: number[];
        endgamePoints: number[];
      }[];
      endgame: {
        resultCount: Partial<Record<ClimbResult, number>>;
        totalAttempts: number;
      };
    }

    const rawDataGrouped = new Array<GroupedData>();
    for (const team of args.teams) {
      rawDataGrouped[team] ||= {
        tournamentData: [],
        endgame: { resultCount: {}, totalAttempts: 0 },
      };
    }

    const tournamentIndexMap = await allTournaments;
    tmd.forEach((val) => {
      const currRow = rawDataGrouped[val.teamNumber];
      const ti = tournamentIndexMap.indexOf(val.tournamentKey);

      if (val.scoutReports.length === 0) {
        return;
      }

      currRow.tournamentData[ti] ||= {
        srEvents: [],
        driverAbility: [],
        endgamePoints: [],
      };

      for (const sr of val.scoutReports) {
        const currRowTournament = currRow.tournamentData[ti];
        currRowTournament.srEvents.push(sr.events);
        currRowTournament.driverAbility.push(sr.driverAbility);
        currRowTournament.endgamePoints.push(endgameToPoints[sr.climbResult]);

        if (
          args.metrics.includes(Metric.climbPoints) &&
          sr.climbResult !== ClimbResult.NOT_ATTEMPTED
        ) {
          currRow.endgame.totalAttempts++;
          currRow.endgame.resultCount[sr.climbResult] ||= 0;
          currRow.endgame.resultCount[sr.climbResult]++;
        }
      }
    });

    const teleopPoints: number[][] = [];
    const autoPoints: number[][] = [];

    const finalResults: Record<string, Record<string, number>> = {};
    for (const metric of args.metrics) {
      let resultsByTournament: number[][] = [];

      if (metric === Metric.climbPoints) {
        finalResults[String(metric)] = {};
        for (const team of args.teams) {
          finalResults[String(metric)][String(team)] = endgameRuleOfSuccession(
            rawDataGrouped[team].endgame.resultCount,
            rawDataGrouped[team].endgame.totalAttempts
          );
        }
        continue;
      } else if (metric === Metric.driverAbility) {
        for (const team of args.teams) {
          resultsByTournament[team] = [];
          rawDataGrouped[team].tournamentData.forEach((tournament) => {
            resultsByTournament[team].push(avgOrZero(tournament.driverAbility));
          });
        }
      } else if (
        metric === Metric.totalPoints ||
        metric === Metric.teleopPoints ||
        metric === Metric.autoPoints
      ) {
        if (
          teleopPoints.length === 0 &&
          (metric === Metric.totalPoints || metric === Metric.teleopPoints)
        ) {
          for (const team of args.teams) {
            teleopPoints[team] = [];
            rawDataGrouped[team].tournamentData.forEach((tournament) => {
              const timedEvents = tournament.srEvents.map((val) =>
                val.filter((e) => e.time > autoEnd)
              );
              const pointSumsByReport = timedEvents.map((e) =>
                e.reduce((acc, cur) => acc + cur.points, 0)
              );
              teleopPoints[team].push(avgOrZero(pointSumsByReport));
            });
          }
        }
        if (
          autoPoints.length === 0 &&
          (metric === Metric.totalPoints || metric === Metric.autoPoints)
        ) {
          for (const team of args.teams) {
            autoPoints[team] = [];
            rawDataGrouped[team].tournamentData.forEach((tournament) => {
              const timedEvents = tournament.srEvents.map((val) =>
                val.filter((e) => e.time <= autoEnd)
              );
              const pointSumsByReport = timedEvents.map((e) =>
                e.reduce((acc, cur) => acc + cur.points, 0)
              );
              autoPoints[team].push(avgOrZero(pointSumsByReport));
            });
          }
        }

        if (metric === Metric.teleopPoints) {
          resultsByTournament = teleopPoints;
        } else if (metric === Metric.autoPoints) {
          resultsByTournament = autoPoints;
        } else if (metric === Metric.totalPoints) {
          for (const team of args.teams) {
            resultsByTournament[team] = [];
            let tournamentIndex = 0;
            rawDataGrouped[team].tournamentData.forEach((tournament) => {
              resultsByTournament[team][tournamentIndex] =
                teleopPoints[team][tournamentIndex] +
                autoPoints[team][tournamentIndex] +
                avgOrZero(tournament.endgamePoints);
              tournamentIndex++;
            });
          }
        }
      } else {
        const action = metricToEvent[metric];
        let position: Position = null;

        for (const team of args.teams) {
          resultsByTournament[team] = [];
          rawDataGrouped[team].tournamentData.forEach((tournament) => {
            let countAtTournament = 0;
            tournament.srEvents.forEach((sr) => {
              sr.forEach((event) => {
                if (
                  event.action === action &&
                  (position === null || event.position === position)
                ) {
                  countAtTournament++;
                }
              });
            });
            resultsByTournament[team].push(
              countAtTournament / tournament.srEvents.length
            );
          });
        }
      }

      finalResults[String(metric)] = {};
      for (const team of args.teams) {
        finalResults[String(metric)][String(team)] = weightedTourAvgLeft(
          resultsByTournament[team]
        );
      }
    }

    return finalResults;
  },
};

export const averageManyFast = async (
  user: User,
  args: z.infer<typeof argsSchema>
) => runAnalysis(config, user, args);

export const getSourceFilter = <T>(
  sources: T[],
  possibleSources: T[]
): ArrayFilter<T> | undefined => {
  if (sources.length === possibleSources.length) {
    return undefined;
  }
  if (sources.length >= possibleSources.length * 0.7) {
    const unsourcedTeams = possibleSources.filter(
      (val) => !sources.includes(val)
    );
    return { notIn: unsourcedTeams };
  }
  return { in: sources };
};

function avgOrZero(values: number[]): number {
  return values.reduce((acc, cur) => acc + cur, 0) / values.length || 0;
}
