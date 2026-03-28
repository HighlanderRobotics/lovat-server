import axios from "axios";
import z from "zod";
import prismaClient from "../../../prismaClient";
import { writeFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const generateSchedule = async (tournamentKey: string) => {
  if (tournamentKey === undefined) {
    throw "tournament key is undefined";
  }

  if (!tournamentKey.startsWith("2026")) {
    return;
  }

  console.log("generating schedule for " + tournamentKey);

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
  console.log("fetching matches for " + tournamentKey);
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

  const lastEODMatch = gaps
    .filter((gap) => gap.type === "EOD")
    .slice(-1)[0].match_number;

  matchesResponse.data = matchesResponse.data.filter(
    (match: any) => match.match_number <= lastEODMatch,
  );

  console.log(matchesResponse.data);
  const teams: Record<number, number> = Object.fromEntries(
    teamsResponse.data
      .map((team: any) => [team.team_number, 0])
      .sort((a: number[], b: number[]) => a[0] - b[0]),
  );

  const csvRows = ["Match Number,Scouter 1,Team,Scouter 2,Team,Scouter 3,Team"];

  for (const match of matchesResponse.data) {
    const gap = gaps.find((g) => g.match_number === match.match_number - 1);
    if (gap) {
      csvRows.push(`${gap.type},-,-,-,-,-,-`);
    }

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

    csvRows.push(`${match.match_number},,${s0},,${s1},,${s2}`);

    for (const t of top3) {
      teams[t]++;
    }
  }

  csvRows.push("EOD,-,-,-,-,-,-");

  console.log(teams);
  console.log(csvRows.join("\n"));

  writeFileSync(
    join(homedir(), "Downloads", "temp", `${tournamentKey}_schedule.csv`),
    csvRows.join("\n"),
  );
};

generateSchedule("2026cagle");

interface Gap {
  match_number: number;
  gap: number;
  type: "LUNCH" | "EOD";
}

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
  console.log(gaps);
  return gaps;
};
