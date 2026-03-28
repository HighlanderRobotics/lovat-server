import axios from "axios";
import z, { ZodError } from "zod";
import prismaClient from "../../../prismaClient.js";
// import { writeFileSync } from "fs";
// import { join } from "path";
// import { homedir } from "os";
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth.js";
import { Response } from "express";

const shiftScouterEx = [
  ["Christian", "Oren", "Ben"],
  ["Gabi", "Jasmeh", "Colin"],
];

const generateSchedule = async (
  tournamentKey: string,
  shiftScouters?: string[][],
) => {
  shiftScouters = shiftScouters || shiftScouterEx;
  if (tournamentKey === undefined) {
    throw "tournament key is undefined";
  }

  if (!tournamentKey.startsWith("2026")) {
    return;
  }

  // console.log("generating schedule for " + tournamentKey);

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
    headers: { "X-TBA-Auth-Key": process.env.TBA_KEY },
  });

  const json = await eventResponse.json();

  const { remap_teams } = z
    .object({
      remap_teams: z
        .record(z.string(), z.string())
        .or(z.null())
        .transform((v) => v ?? {}),
    })
    .parse(json);

  let matchesResponse = null;
  let teamsResponse = null;
  // console.log("fetching matches for " + tournamentKey);
  try {
    matchesResponse = await axios.get(`${url}/event/${tournamentKey}/matches`, {
      headers: {
        "X-TBA-Auth-Key": process.env.TBA_KEY,
      },
    });
    teamsResponse = await axios.get(`${url}/event/${tournamentKey}/teams`, {
      headers: {
        "X-TBA-Auth-Key": process.env.TBA_KEY,
      },
    });
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

  matchesResponse.data = matchesResponse.data.filter(
    (match: any) => match.comp_level === "qm",
  );

  matchesResponse.data.sort(
    (a: any, b: any) => a.match_number - b.match_number,
  );

  const gaps = await getScheduleGaps(matchesResponse.data);

  const shifts = await buildShifts(gaps, shiftScouters);

  const lastEODMatch = gaps
    .filter((gap) => gap.type === "EOD")
    .slice(-1)[0].match_number;

  matchesResponse.data = matchesResponse.data.filter(
    (match: any) => match.match_number <= lastEODMatch,
  );

  const teams: Record<number, number> = Object.fromEntries(
    teamsResponse.data
      .map((team: any) => [team.team_number, 0])
      .sort((a: number[], b: number[]) => a[0] - b[0]),
  );

  const csvRows = [
    "Match Number,Scouter 1,Team,Scouter 2,Team,Scouter 3,Team,Expected Time",
  ];

  for (const match of matchesResponse.data) {
    const gap = gaps.find((g) => g.match_number === match.match_number - 1);
    const newShift = shifts.find((g) => g.end === match.match_number - 1);
    if (gap) {
      csvRows.push(`${gap.type},,,,,,,`);
    } else if (newShift) {
      csvRows.push(`SHIFT CHANGE,,,,,,,`);
    }

    const shift = shifts.find(
      (s) => match.match_number >= s.start && match.match_number <= s.end,
    );
    const teamNumbers = [
      ...match.alliances.red.team_keys,
      ...match.alliances.blue.team_keys,
    ].map((teamKey: string) => {
      if (remap_teams[teamKey]) {
        return parseInt(remap_teams[teamKey].replace("frc", ""));
      }
      return parseInt(teamKey.replace("frc", ""));
    });

    for (const t of teamNumbers) {
      if (teams[t] === undefined) teams[t] = 0;
    }

    const top3 = [...teamNumbers]
      .sort((a, b) => teams[a] - teams[b])
      .slice(0, 3);

    const s0 = top3[match.match_number % 3];
    const s1 = top3[(match.match_number + 1) % 3];
    const s2 = top3[(match.match_number + 2) % 3];

    csvRows.push(
      `${match.match_number},${shift.scouters[0]},${s0},${shift.scouters[1]},${s1},${shift.scouters[2]},${s2},${new Date(
        match.time * 1000,
      ).toLocaleTimeString("en-US", {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
      })}`,
    );

    for (const t of top3) {
      teams[t]++;
    }
  }

  csvRows.push("EOD,,,,,,,");

  // console.log(csvRows.join("\n"));

  // writeFileSync(
  //   join(homedir(), "Downloads", "temp", `${tournamentKey}_schedule.csv`),
  //   csvRows.join("\n"),
  // );

  return csvRows.join("\n");
};

export const superScoutingSchedule = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const params = z.object({ tournamentKey: z.string() }).parse(req.query);

    const schedule = await generateSchedule(params.tournamentKey);

    res.status(200).send(schedule);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).send("Bad input");
    } else {
      res.status(500).send("Internal server error");
    }
  }
};

interface Gap {
  match_number: number;
  gap: number;
  type: "LUNCH" | "EOD";
}

interface Period {
  start: number;
  end: number;
}

interface Shift {
  start: number;
  end: number;
  scouters: string[];
}

const optimalMatches = 10;

const getScheduleGaps = async (matches: any[]) => {
  let previousTime = matches[0].time;
  const gaps: Gap[] = [];
  for (const match of matches) {
    const gap = match.time - previousTime;
    if (gap > 1000) {
      gaps.push({
        match_number: match.match_number - 1,
        gap: gap,
        type: gap < 10000 ? "LUNCH" : "EOD",
      });
    }
    previousTime = match.time;
  }
  // console.log(gaps);
  return gaps;
};

const buildShifts = (gaps: Gap[], shiftScouters: string[][] = []) => {
  let periodStart = 1;
  const periods: Period[] = [];
  const shifts: Shift[] = [];
  for (const gap of gaps) {
    periods.push({
      start: periodStart,
      end: gap.match_number,
    });
    periodStart = gap.match_number + 1;
  }
  // console.log(periods.length);

  for (const period of periods) {
    const periodLength = period.end - period.start + 1;
    // console.log(periodLength);
    const numShifts = Math.ceil(periodLength / optimalMatches);
    // console.log(numShifts);
    const shiftLength = Math.ceil(periodLength / numShifts);
    // console.log(shiftLength);
    for (let i = 0; i < numShifts; i++) {
      shifts.push({
        start: period.start + i * shiftLength,
        end: Math.min(period.start + (i + 1) * shiftLength - 1, period.end),
        scouters: shiftScouters[i % shiftScouters.length],
      });
    }
  }

  // console.log(shifts);

  return shifts;
};
