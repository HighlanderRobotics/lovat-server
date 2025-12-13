import { Response } from "express";
import prismaClient from "../../../prismaClient.js";
import z from "zod";
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth.js";
import { addTournamentMatches } from "./addTournamentMatches.js";
import {
  MatchTypeMap,
  MatchTypeToAbrivation,
  ReverseMatchTypeMap,
  ReverseScouterScheduleMap,
  ScouterScheduleMap,
} from "../managerConstants.js";
import {
  dataSourceRuleSchema,
  dataSourceRuleToArray,
  dataSourceRuleToPrismaFilter,
} from "../../analysis/dataSourceRule.js";
import { allTeamNumbers } from "../../analysis/analysisConstants.js";

export const getMatches = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const user = req.user;

    const isScouted =
      req.query.isScouted !== undefined ? req.query.isScouted === "true" : null;
    const teams =
      req.query.teams !== undefined
        ? (JSON.parse(req.query.teams as string) as number[])
        : null;

    const params = z
      .object({
        tournamentKey: z.string(),
        teamNumbers: z.array(z.number()).nullable(),
        isScouted: z.boolean().nullable(),
      })
      .safeParse({
        tournamentKey: req.params.tournament,
        teamNumbers: teams,
        isScouted: isScouted,
      });
    if (!params.success) {
      res.status(400).send(params);
      return;
    }

    const matchExists = await prismaClient.teamMatchData.findFirst({
      where: { tournamentKey: params.data.tournamentKey },
    });
    if (!matchExists) {
      await addTournamentMatches(params.data.tournamentKey);
    }

    const allMatches = await prismaClient.teamMatchData.findMany({
      where: {
        tournamentKey: params.data.tournamentKey,
      },
      include: {
        scoutReports: {
          include: {
            scouter: true,
          },
        },
      },
    });

    if (allMatches.length === 0) {
      res
        .status(404)
        .send("The match schedule for this tournament hasn't been posted yet.");
      return;
    }

    interface GroupedMatchTeam {
      teamNumber: number;
      alliance: string;
      scouters: { name: string; scouted: boolean }[];
      externalReports: number;
      teamPosition: string; // team1, team2, etc.
    }
    interface GroupedMatch {
      matchNumber: number;
      matchType: keyof typeof ReverseMatchTypeMap;
      tournamentKey: string;
      teams: GroupedMatchTeam[];
      scoutReports: (typeof allMatches)[0]["scoutReports"];
    }

    const groupedMatches: Record<string, GroupedMatch> = allMatches.reduce(
      (acc, match) => {
        const key = `${match.matchNumber}-${match.matchType}`;
        if (!acc[key]) {
          acc[key] = {
            matchNumber: match.matchNumber,
            matchType: match.matchType as keyof typeof ReverseMatchTypeMap,
            tournamentKey: match.tournamentKey,
            teams: [],
            scoutReports: [],
          } as GroupedMatch;
        }

        const teamPosition =
          ScouterScheduleMap[match.key[match.key.length - 1]];
        const alliance =
          parseInt(match.key[match.key.length - 1]) < 3 ? "red" : "blue";

        acc[key].teams.push({
          teamNumber: match.teamNumber,
          alliance: alliance,
          scouters: [],
          externalReports: 0,
          teamPosition: teamPosition,
        });

        acc[key].scoutReports.push(...match.scoutReports);
        return acc;
      },
      {} as Record<string, GroupedMatch>,
    );

    let finalMatches = Object.values(groupedMatches);

    if (
      params.data.teamNumbers &&
      params.data.teamNumbers.length > 0 &&
      params.data.teamNumbers.length <= 6
    ) {
      finalMatches = finalMatches.filter((match) => {
        const teamNumbers = match.teams.map((team) => team.teamNumber);
        return params.data.teamNumbers!.every((num) => teamNumbers.includes(num));
      });
    }

    const teamNumbers = await allTeamNumbers;

    if (params.data.isScouted !== null) {
      finalMatches = finalMatches.filter((match) => {
        const scouted = match.scoutReports.some((report) =>
          dataSourceRuleToArray(
            dataSourceRuleSchema(z.number()).parse(req.user.teamSourceRule),
            teamNumbers,
          ).includes(report.scouter.sourceTeamNumber),
        );
        return params.data.isScouted ? scouted : !scouted;
      });
    }

    finalMatches.sort((a, b) => {
      if (a.matchType < b.matchType) return 1;
      if (a.matchType > b.matchType) return -1;
      return a.matchNumber - b.matchNumber;
    });

    const finalFormatedMatches = finalMatches.map((match) => {
      const teams = match.teams.sort((a, b) =>
        a.teamPosition.localeCompare(b.teamPosition),
      );

      return {
        tournamentKey: match.tournamentKey,
        matchNumber: match.matchNumber,
        matchType: ReverseMatchTypeMap[match.matchType],
        scouted: match.scoutReports.some((report) =>
          dataSourceRuleToArray(
            dataSourceRuleSchema(z.number()).parse(user.teamSourceRule),
            teamNumbers,
          ).includes(report.scouter.sourceTeamNumber),
        ),
        team1: teams.find((team) => team.teamPosition === "team1"),
        team2: teams.find((team) => team.teamPosition === "team2"),
        team3: teams.find((team) => team.teamPosition === "team3"),
        team4: teams.find((team) => team.teamPosition === "team4"),
        team5: teams.find((team) => team.teamPosition === "team5"),
        team6: teams.find((team) => team.teamPosition === "team6"),
      };
    });

    type ShiftScouter = { uuid: string; name: string; sourceTeamNumber: number };
    type TeamKey = "team1" | "team2" | "team3" | "team4" | "team5" | "team6";
    type ScouterShift = {
      startMatchOrdinalNumber: number;
      endMatchOrdinalNumber: number;
      team1?: ShiftScouter[];
      team2?: ShiftScouter[];
      team3?: ShiftScouter[];
      team4?: ShiftScouter[];
      team5?: ShiftScouter[];
      team6?: ShiftScouter[];
    };
     const scouterShifts: ScouterShift[] = [];
     if (user.teamNumber) {
      const shifts = await prismaClient.scouterScheduleShift.findMany({
        where: {
          tournamentKey: params.data.tournamentKey,
          sourceTeamNumber: user.teamNumber,
        },
        include: {
          team1: true,
          team2: true,
          team3: true,
          team4: true,
          team5: true,
          team6: true,
        },
      });
      scouterShifts.push(...shifts);
    }

    const scoutReports = await prismaClient.scoutReport.findMany({
      where: {
        teamMatchData: {
          tournamentKey: params.data.tournamentKey,
        },
        scouter: {
          sourceTeamNumber: user.teamNumber,
        },
      },
      include: {
        scouter: true,
        teamMatchData: true,
      },
    });

    const externalReports = await prismaClient.scoutReport.groupBy({
      by: ["teamMatchKey"],
      _count: { _all: true },
      where: {
        teamMatchData: { tournamentKey: params.data.tournamentKey },
        scouter: {
          sourceTeamNumber: dataSourceRuleToPrismaFilter(
            dataSourceRuleSchema(z.number()).parse(req.user.teamSourceRule),
          ),
        },
      },
    });

    const externalReportsMap = externalReports.reduce(
      (acc, report) => {
        acc[report.teamMatchKey] = report._count._all;
        return acc;
      },
      {} as Record<string, number>,
    );

    const scouterShiftsMap = scouterShifts.reduce(
      (acc, shift) => {
        for (let i = 1; i <= 6; i++) {
          const teamKey = `team${i}` as TeamKey;
          const scouters = shift[teamKey];
          scouters?.forEach((scouter) => {
            acc[scouter.uuid] = scouter.name;
          });
        }
        return acc;
      },
      {} as Record<string, string>,
    );

    for (const match of finalFormatedMatches) {
      for (let i = 1; i <= 6; i++) {
        const teamKey = `team${i}` as keyof typeof match;
        const team = match[teamKey] as GroupedMatchTeam | undefined;
        if (!team) continue;

        const teamScoutReports = scoutReports.filter(
          (report) =>
            report.teamMatchData.key.endsWith(
              ReverseScouterScheduleMap[teamKey as string],
            ) &&
            report.teamMatchData.matchNumber === match.matchNumber &&
            report.teamMatchData.matchType === MatchTypeMap[match.matchType],
        );

        team.scouters = teamScoutReports.map((report) => ({
          name: report.scouter.name,
          scouted: true,
        }));

        if (user.teamNumber) {
          const assignedShifts = scouterShifts.filter(
            (shift) =>
              shift.startMatchOrdinalNumber <= match.matchNumber &&
              shift.endMatchOrdinalNumber >= match.matchNumber,
          );

          const assignedScouters = assignedShifts
            .flatMap((shift) => {
                const scouters = shift[teamKey as TeamKey];
                return scouters || [];
              })
            .filter((scouter) => scouter.sourceTeamNumber === user.teamNumber);

          assignedScouters.forEach((scouter) => {
            if (
              !team.scouters.some(
                (s) => s.name === scouter.name && s.scouted === true,
              )
            ) {
              team.scouters.push({ name: scouter.name, scouted: false });
            }
          });
        }

        const teamMatchKey = `${match.tournamentKey}_${
          MatchTypeToAbrivation[match.matchType]
        }${match.matchNumber}_${ReverseScouterScheduleMap[teamKey as string]}`;
        team.externalReports = externalReportsMap[teamMatchKey] || 0;
      }
    }

    res.status(200).send(finalFormatedMatches);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};
