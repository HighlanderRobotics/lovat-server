import axios, { AxiosResponse } from "axios";
import prismaClient from "../prismaClient.js";
import z from "zod";
import {
  eightTeamDoubleElimPlayoffMatchOrder,
  fourTeamDoubleElimPlayoffMatchOrder,
} from "../handler/manager/managerConstants.js";
import { DateTime } from "luxon";
import { AllianceColor, MatchType } from "@prisma/client";

interface TBAEventResponse {
  remap_teams: Record<string, string>;
  playoff_type: number;
  key: string;
  name: string;
  event_code: string;
  event_type: 0;
  district: {
    abbreviation: string;
    display_name: string;
    key: string;
    year: number;
    official_advancement_counts: {
      dcmp: number;
      cmp: number;
    };
  };
  city: string;
  state_prov: string;
  country: string;
  start_date: DateTime;
  end_date: DateTime;
  year: number;
  short_name: string;
  event_type_string: string;
  week: number;
  address: string;
  postal_code: string;
  gmaps_place_id: string;
  gmaps_url: string;
  lat: number;
  lng: number;
  location_name: string;
  timezone: string;
  website: string;
  first_event_id: string;
  first_event_code: string;
  webcasts: [
    {
      type: string;
      channel: string;
      date: string;
      file: string;
      status: string;
      stream_title: string;
      viewer_count: number;
    },
  ];
  division_keys: [string];
  parent_event_key: string;
  playoff_type_string: string;
}

interface TBAAlliance {
  score: number | null;
  team_keys: string[];
  surrogate_team_keys: string[];
  dq_team_keys: string[];
}

interface TBAMatch {
  key: string;
  comp_level: "qm" | "em";
  set_number: number;
  match_number: number;
  alliances: {
    red: TBAAlliance;
    blue: TBAAlliance;
  };
  winning_alliance: string;
  event_key: string;
  time: number;
  actual_time: number;
  predicted_time: number;
  post_result_time: number;
  score_breakdown: {
    blue: {};
    red: {};
  };
  videos: [
    {
      type: string;
      key: string;
    },
  ];
}

export const importTournamentMatches = async (
  tournamentKey: string,
): Promise<void> => {
  if (!tournamentKey.startsWith("2026")) {
    return;
  }

  const tba = "https://www.thebluealliance.com/api/v3";

  // Fetch event data
  const event = await fetchFromTBA<TBAEventResponse>(
    `${tba}/event/${tournamentKey}`,
  );

  // Create a list of remapped teams (8033B, 254C, 4414D, etc)
  const remap_teams =
    z
      .object({
        remap_teams: z.record(z.string(), z.string()).nullish(),
      })
      .passthrough()
      .parse(event).remap_teams ?? {};

  const fixRemappedTeam = async (team: string): Promise<number> => {
    const fakeTeamKey = team; // The one TBA sends you which is potentially "fake", like frc6418B
    const mapEntry = Object.entries(remap_teams).find(
      (v) => v[1] === fakeTeamKey,
    );
    const realTeamKey = mapEntry ? mapEntry[0] : fakeTeamKey;
    return Number(realTeamKey.substring(3));
  };

  // Fetch all matches from the tournament
  const matches = await fetchFromTBA<TBAMatch[]>(
    `${tba}/event/${tournamentKey}/matches`,
  );

  if (event === undefined || matches === undefined) return;

  const playoffMatchOrder =
    event.playoff_type === 10
      ? eightTeamDoubleElimPlayoffMatchOrder
      : fourTeamDoubleElimPlayoffMatchOrder;

  // Sort matches by time
  matches.sort(
    (a: TBAMatch, b: TBAMatch) =>
      (a.actual_time ?? a.time ?? 0) - (b.actual_time ?? b.time ?? 0),
  );

  const quals = matches.filter((match) => match.comp_level === "qm");

  for (const match of quals) {
    const matchTeams = [
      ...match.alliances.red.team_keys,
      ...match.alliances.blue.team_keys,
    ];

    // Match
    await prismaClient.match.upsert({
      where: {
        key: match.key,
      },
      update: {
        year: event.year,
        compLevel: MatchType.QUALIFICATION,
        setNumber: match.set_number,
        matchNumber: match.match_number,
        scheduledTime: new Date(match.time * 1000),
        actualTime: new Date(match.actual_time * 1000),
        redScore: match.alliances.red.score,
        blueScore: match.alliances.blue.score,
        rawTba: JSON.stringify(match),
        updatedAt: new Date(),
      },
      create: {
        key: match.key,
        tournamentKey: event.key,
        year: event.year,
        compLevel: MatchType.QUALIFICATION,
        setNumber: match.set_number,
        matchNumber: match.match_number,
        scheduledTime: new Date(match.time * 1000),
        actualTime: new Date(match.actual_time * 1000),
        redScore: match.alliances.red.score,
        blueScore: match.alliances.blue.score,
        rawTba: JSON.stringify(match),
        updatedAt: new Date(),
      },
    });

    for (let t = 0; t < 6; t++) {
      const params = z
        .object({
          matchNumber: z.number(),
          tournamentKey: z.string(),
          key: z.string(),
          teamNumber: z.number(),
          alliance: z.nativeEnum(AllianceColor),
          station: z.number(),
        })
        .safeParse({
          key: `${tournamentKey}_qm${match.match_number}`,
          tournamentKey: tournamentKey,
          matchNumber: match.match_number,
          teamNumber: await fixRemappedTeam(matchTeams[t]),
          alliance: t > 2 ? AllianceColor.BLUE : AllianceColor.RED,
          station: t % 3,
        });

      if (!params.success) {
        throw params;
      }
      // TeamMatchData (old)
      await prismaClient.teamMatchData.upsert({
        where: {
          key: `${params.data.key}_${t}`,
        },
        update: {
          tournamentKey: params.data.tournamentKey,
          matchNumber: params.data.matchNumber,
          teamNumber: params.data.teamNumber,
          matchType: MatchType.QUALIFICATION,
        },
        create: {
          key: `${params.data.key}_${t}`,
          tournamentKey: params.data.tournamentKey,
          matchNumber: params.data.matchNumber,
          teamNumber: params.data.teamNumber,
          matchType: MatchType.QUALIFICATION,
        },
      });

      // MatchParticipant
      await prismaClient.matchParticipant.upsert({
        where: {
          teamMatchKey: `${params.data.key}_${t}`,
        },
        update: {
          matchKey: params.data.key,
          alliance: params.data.alliance,
          teamNumber: params.data.teamNumber,
          station: params.data.station,
        },
        create: {
          teamMatchKey: `${params.data.key}_${t}`,
          matchKey: params.data.key,
          alliance: params.data.alliance,
          teamNumber: params.data.teamNumber,
          station: params.data.station,
        },
      });
    }
    console.log(`Q${match.match_number} imported`);
  }

  const elims = matches.filter((match) => match.comp_level === "em");

  for (const match of elims) {
    const matchTeams = [
      ...match.alliances.red.team_keys,
      ...match.alliances.blue.team_keys,
    ];

    if (matchTeams.length !== 6) {
      continue;
    }

    const matchSuffix = match.key.split("_")[1] ?? "";

    const matchNumber = playoffMatchOrder.get(matchSuffix);

    if (!matchNumber) {
      continue;
    }

    for (let t = 0; t < 6; t++) {
      const params = z
        .object({
          matchNumber: z.number(),
          tournamentKey: z.string(),
          key: z.string(),
          teamNumber: z.number(),
          alliance: z.nativeEnum(AllianceColor),
          station: z.number(),
        })
        .safeParse({
          key: `${tournamentKey}_em${matchNumber}`,
          tournamentKey: tournamentKey,
          matchNumber: matchNumber,
          teamNumber: await fixRemappedTeam(matchTeams[t]),
          alliance: t > 2 ? AllianceColor.BLUE : AllianceColor.RED,
          station: t % 3,
        });

      if (!params.success) {
        throw params;
      }
      // TeamMatchData (old)
      await prismaClient.teamMatchData.upsert({
        where: {
          key: `${params.data.key}_${t}`,
        },
        update: {
          tournamentKey: params.data.tournamentKey,
          matchNumber: params.data.matchNumber,
          teamNumber: params.data.teamNumber,
          matchType: MatchType.ELIMINATION,
        },
        create: {
          key: `${params.data.key}_${t}`,
          tournamentKey: params.data.tournamentKey,
          matchNumber: params.data.matchNumber,
          teamNumber: params.data.teamNumber,
          matchType: MatchType.ELIMINATION,
        },
      });

      // MatchParticipant
      await prismaClient.matchParticipant.upsert({
        where: {
          teamMatchKey: `${params.data.key}_${t}`,
        },
        update: {
          matchKey: params.data.key,
          alliance: params.data.alliance,
          teamNumber: params.data.teamNumber,
          station: params.data.station,
        },
        create: {
          teamMatchKey: `${params.data.key}_${t}`,
          matchKey: params.data.key,
          alliance: params.data.alliance,
          teamNumber: params.data.teamNumber,
          station: params.data.station,
        },
      });
    }

    // Match
    await prismaClient.match.upsert({
      where: {
        key: `${tournamentKey}_em${matchNumber}`,
      },
      update: {
        year: event.year,
        compLevel: MatchType.ELIMINATION,
        setNumber: match.set_number,
        matchNumber: match.match_number,
        scheduledTime: new Date(match.time * 1000),
        actualTime: new Date(match.actual_time * 1000),
        redScore: match.alliances.red.score,
        blueScore: match.alliances.blue.score,
        rawTba: JSON.stringify(match),
        updatedAt: new Date(),
      },
      create: {
        key: `${tournamentKey}_em${matchNumber}`,
        tournamentKey: event.key,
        year: event.year,
        compLevel: MatchType.ELIMINATION,
        setNumber: match.set_number,
        matchNumber: match.match_number,
        scheduledTime: new Date(match.time * 1000),
        actualTime: new Date(match.actual_time * 1000),
        redScore: match.alliances.red.score,
        blueScore: match.alliances.blue.score,
        rawTba: JSON.stringify(match),
        updatedAt: new Date(),
      },
    });
  }
};

const fetchFromTBA = async <T>(url: string): Promise<T | undefined> => {
  const fetchRow = await prismaClient.dataFetch.findUnique({
    where: {
      key: url,
    },
  });

  let response: AxiosResponse<T>;

  try {
    const now = new Date();

    response = await axios.get<T>(url, {
      headers: {
        "X-TBA-Auth-Key": process.env.TBA_KEY,
        "If-None-Match": fetchRow?.etag ?? undefined,
      },
      validateStatus: (status) =>
        (status >= 200 && status < 300) || status === 304,
    });

    if (response.status !== 304) {
      await prismaClient.dataFetch.upsert({
        where: {
          key: url,
        },
        create: {
          key: url,
          lastTried: new Date(),
          etag: response.headers.etag,
          data: JSON.stringify(response.data),
        },
        update: {
          lastTried: new Date(),
          etag: response.headers.etag,
          data: JSON.stringify(response.data),
        },
      });

      return response.data;
    } else {
      await prismaClient.dataFetch.update({
        where: {
          key: url,
        },
        data: {
          lastFetched: now,
          lastTried: now,
        },
      });

      return JSON.parse(fetchRow?.data ?? "null") as T;
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const validateETag = async (url: string) => {
  const now = new Date();

  await prismaClient.dataFetch.update({
    where: {
      key: url,
    },
    data: {
      lastFetched: now,
      lastTried: now,
    },
  });
};
