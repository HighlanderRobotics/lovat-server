import prismaClient from "../../prismaClient.js";
import z from "zod";
import axios from "axios";
import type { AxiosResponse } from "axios";
import { CURRENT_YEAR } from "./managerConstants.js";

interface TbaAlliance {
  score: number;
  team_keys: string[];
}

interface TbaMatch {
  actual_time: number | null;
  time: number | null;
  comp_level: string;
  match_number: number;
  key: string;
  winning_alliance: string;
  alliances: {
    red: TbaAlliance;
    blue: TbaAlliance;
  };
}

type TbaMatchesResponse = TbaMatch[];

const getMatchStatus = (
  match: TbaMatch,
): "SCHEDULED" | "IN_PROGRESS" | "OFFICIAL" => {
  const played =
    (match.winning_alliance ?? "") !== "" ||
    match.alliances.red.score > 0 ||
    match.alliances.blue.score > 0;
  if (played) {
    return "OFFICIAL";
  }
  if (match.actual_time !== null) {
    return "IN_PROGRESS";
  }
  return "SCHEDULED";
};

const getMatchResult = (match: TbaMatch): "RED" | "BLUE" | "TIE" => {
  if (match.winning_alliance === "red") {
    return "RED";
  }
  if (match.winning_alliance === "blue") {
    return "BLUE";
  }
  return "TIE";
};

// TBA reports -1 for alliances that haven't scored yet
const getScore = (score: number): number | null => (score >= 0 ? score : null);

const mapTeamKey = (
  teamKey: string,
  remapTeams: Record<string, string>,
): number => {
  const mapEntry = Object.entries(remapTeams).find((v) => v[1] === teamKey);
  const realTeamKey = mapEntry ? mapEntry[0] : teamKey;
  return Number(realTeamKey.substring(3));
};

export const addTournamentMatches = async (
  tournamentKey: string,
): Promise<void> => {
  try {
    if (tournamentKey === undefined) {
      throw "tournament key is undefined";
    }
    console.log(tournamentKey);

    // Old tournaments are bulk-deleted by fetchMatches; don't import their matches
    if (!tournamentKey.startsWith(CURRENT_YEAR)) {
      return;
    }

    const url = "https://www.thebluealliance.com/api/v3";
    const tournamentRow = await prismaClient.tournament.findUnique({
      where: {
        key: tournamentKey,
      },
    });

    if (tournamentRow === null) {
      throw "tournament not found when trying to insert tournament matches";
    }

    const eventResponse = await fetch(`${url}/event/${tournamentKey}`, {
      headers: { "X-TBA-Auth-Key": process.env.TBA_KEY ?? "" },
    });

    const json: unknown = await eventResponse.json();

    //console.log(JSON.stringify(json, null, 2));

    const event = z
      .object({
        remap_teams: z.record(z.string(), z.string()).nullish(),
      })
      .passthrough()
      .parse(json);

    const remap_teams = event.remap_teams ?? {};
    let matchesResponse: AxiosResponse<TbaMatchesResponse>;
    try {
      matchesResponse = await axios.get<TbaMatchesResponse>(
        `${url}/event/${tournamentKey}/matches`,
        {
          headers: {
            "X-TBA-Auth-Key": process.env.TBA_KEY,
            "If-None-Match": tournamentRow.latestFetchETag ?? "",
          },
        },
      );
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 304) {
        return;
      } else {
        throw error;
      }
    }

    await prismaClient.tournament.update({
      where: {
        key: tournamentKey,
      },
      data: {
        latestFetchETag: matchesResponse.headers.etag,
      },
    });

    // playoff formats come from tba's event.playoff_type
    // Double Elim 8 team is 10
    // Double Elim 4 team is 11
    // as per https://github.com/the-blue-alliance/the-blue-alliance/blob/main/src/backend/common/consts/playoff_type.py

    const eightTeamDoubleElimPlayoffMatchOrder = new Map<string, number>([
      ["sf1m1", 1],
      ["sf2m1", 2],
      ["sf3m1", 3],
      ["sf4m1", 4],
      ["sf5m1", 5],
      ["sf6m1", 6],
      ["sf7m1", 7],
      ["sf8m1", 8],
      ["sf9m1", 9],
      ["sf10m1", 10],
      ["sf11m1", 11],
      ["sf12m1", 12],
      ["sf13m1", 13],
      ["f1m1", 14],
      ["f1m2", 15],
    ]);

    const fourTeamDoubleElimPlayoffMatchOrder = new Map<string, number>([
      ["sf1m1", 1],
      ["sf2m1", 2],
      ["sf3m1", 3],
      ["sf4m1", 4],
      ["sf5m1", 5],
      ["f1m1", 6],
      ["f1m2", 7],
    ]);

    const playoffMatchOrder =
      event.playoff_type === 10
        ? eightTeamDoubleElimPlayoffMatchOrder
        : fourTeamDoubleElimPlayoffMatchOrder;

    // For each match in the tournament
    matchesResponse.data.sort(
      (a: TbaMatch, b: TbaMatch) =>
        (a.actual_time ?? a.time ?? 0) - (b.actual_time ?? b.time ?? 0),
    );

    for (const match of matchesResponse.data) {
      if (match.comp_level == "qm") {
        //all teams in the match
        const teams = [
          ...match.alliances.red.team_keys,
          ...match.alliances.blue.team_keys,
        ];

        //console.log(teams);

        const redTeams = match.alliances.red.team_keys.map((teamKey) =>
          mapTeamKey(teamKey, remap_teams),
        );
        const blueTeams = match.alliances.blue.team_keys.map((teamKey) =>
          mapTeamKey(teamKey, remap_teams),
        );

        await prismaClient.match.upsert({
          where: {
            key: `${tournamentKey}_qm${match.match_number}`,
          },
          update: {
            red: redTeams,
            blue: blueTeams,
            matchStatus: getMatchStatus(match),
            matchResult: getMatchResult(match),
            redScore: getScore(match.alliances.red.score),
            blueScore: getScore(match.alliances.blue.score),
          },
          create: {
            key: `${tournamentKey}_qm${match.match_number}`,
            tournamentKey,
            matchNumber: match.match_number,
            red: redTeams,
            blue: blueTeams,
            matchType: "QUALIFICATION",
            matchStatus: getMatchStatus(match),
            matchResult: getMatchResult(match),
            redScore: getScore(match.alliances.red.score),
            blueScore: getScore(match.alliances.blue.score),
          },
        });

        let matchesString = ``;
        //make matches with trailing _0, _1, _2 etc
        for (let k = 0; k < teams.length; k++) {
          matchesString =
            matchesString +
            `('${tournamentKey}_qm${match.match_number}_${k}', '${tournamentKey}', ${match.match_number}, '${teams[k]}', '${match.comp_level}'), `;
          const currMatchKey = `${tournamentKey}_qm${match.match_number}_${k}`;

          const fakeTeamKey = teams[k]; // The one TBA sends you which is potentially "fake", like frc6418B
          const currTeam = mapTeamKey(fakeTeamKey, remap_teams);

          const params = z
            .object({
              matchNumber: z.number(),
              tournamentKey: z.string(),
              key: z.string(),
              teamNumber: z.number(),
            })
            .safeParse({
              key: currMatchKey,
              tournamentKey: tournamentKey,
              matchNumber: match.match_number,
              teamNumber: currTeam,
            });

          if (!params.success) {
            throw params;
          }

          //cant use currMatch key bc theres an issue with the enum
          await prismaClient.teamMatchData.upsert({
            where: {
              key: currMatchKey,
            },
            update: {
              tournamentKey: params.data.tournamentKey,
              matchNumber: params.data.matchNumber,
              teamNumber: params.data.teamNumber,
              matchType: "QUALIFICATION",
              matchKey: `${tournamentKey}_qm${match.match_number}`,
            },
            create: {
              key: params.data.key,
              tournamentKey: params.data.tournamentKey,
              matchNumber: params.data.matchNumber,
              teamNumber: params.data.teamNumber,
              matchType: "QUALIFICATION",
              matchKey: `${tournamentKey}_qm${match.match_number}`,
            },
          });
        }
      } else {
        const teams = [
          ...match.alliances.red.team_keys,
          ...match.alliances.blue.team_keys,
        ];

        if (teams.length !== 6) {
          continue;
        }

        const mappedTeams: number[] = [];
        let allTeamsKnown = true;
        for (const teamKey of teams) {
          const teamNumber = mapTeamKey(teamKey, remap_teams);
          if (!Number.isFinite(teamNumber) || teamNumber <= 0) {
            allTeamsKnown = false;
            break;
          }
          mappedTeams.push(teamNumber);
        }

        if (!allTeamsKnown) {
          continue;
        }

        const matchSuffix = match.key.split("_")[1] ?? "";
        const matchNumber = playoffMatchOrder.get(matchSuffix);
        if (!matchNumber) {
          continue;
        }

        await prismaClient.match.upsert({
          where: {
            key: `${tournamentKey}_em${matchNumber}`,
          },
          update: {
            red: mappedTeams.slice(0, 3),
            blue: mappedTeams.slice(3, 6),
            matchStatus: getMatchStatus(match),
            matchResult: getMatchResult(match),
            redScore: getScore(match.alliances.red.score),
            blueScore: getScore(match.alliances.blue.score),
          },
          create: {
            key: `${tournamentKey}_em${matchNumber}`,
            tournamentKey,
            matchNumber,
            red: mappedTeams.slice(0, 3),
            blue: mappedTeams.slice(3, 6),
            matchType: "ELIMINATION",
            matchStatus: getMatchStatus(match),
            matchResult: getMatchResult(match),
            redScore: getScore(match.alliances.red.score),
            blueScore: getScore(match.alliances.blue.score),
          },
        });

        for (let k = 0; k < 6; k++) {
          const currTeam = mappedTeams[k];

          const currMatchKey = `${tournamentKey}_em${matchNumber}_${k}`;

          const params = z
            .object({
              matchNumber: z.number(),
              tournamentKey: z.string(),
              key: z.string(),
              teamNumber: z.number(),
            })
            .safeParse({
              key: currMatchKey,
              tournamentKey: tournamentKey,
              matchNumber: matchNumber,
              teamNumber: currTeam,
            });

          if (!params.success) {
            throw params;
          }

          //cant use currMatch key bc theres an issue with the enum
          await prismaClient.teamMatchData.upsert({
            where: {
              key: currMatchKey,
            },
            update: {
              tournamentKey: params.data.tournamentKey,
              matchNumber: params.data.matchNumber,
              teamNumber: params.data.teamNumber,
              matchType: "ELIMINATION",
              matchKey: `${tournamentKey}_em${matchNumber}`,
            },
            create: {
              key: params.data.key,
              tournamentKey: params.data.tournamentKey,
              matchNumber: params.data.matchNumber,
              teamNumber: params.data.teamNumber,
              matchType: "ELIMINATION",
              matchKey: `${tournamentKey}_em${matchNumber}`,
            },
          });
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
};
