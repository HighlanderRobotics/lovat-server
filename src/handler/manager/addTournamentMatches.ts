import prismaClient from "../../prismaClient.js";
import z from "zod";
import axios from "axios";

export const addTournamentMatches = async (
  tournamentKey: string,
): Promise<void> => {
  try {
    if (tournamentKey === undefined) {
      throw "tournament key is undefined";
    }

    if (!tournamentKey.startsWith("2026")) {
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
      headers: { "X-TBA-Auth-Key": process.env.TBA_KEY },
    });

    const nexusResponse = await fetch(
      `https://frc.nexus/api/v1/event/${tournamentKey}`,
      {
        method: "GET",
        headers: {
          "Nexus-Api-Key": process.env.NEXUS_KEY ?? "",
        },
      },
    );

    console.log(nexusResponse);

    if (!nexusResponse.ok) {
      const errorMessage = await nexusResponse.text();
      console.error("Error getting live event status:", errorMessage);
    } else {
      const data = await nexusResponse.json();

      console.log(data);

      for (const match of data.matches) {
        if (match.label.startsWith("Practice")) {
          const practiceMatchNumber = parseInt(match.label.split(" ")[1]);
          if (isNaN(practiceMatchNumber)) {
            continue;
          }

          const matchKey = `${tournamentKey}_pr${practiceMatchNumber}`;
          for (let i = 0; i < match.redTeams.length; i++) {
            const teamNumber = Number(match.redTeams[i]);
            const currMatchKey = `${matchKey}_${i}`;
            await prismaClient.teamMatchData.upsert({
              where: {
                key: currMatchKey,
              },
              update: {
                tournamentKey: tournamentKey,
                matchNumber: practiceMatchNumber,
                teamNumber: teamNumber,
                matchType: "PRACTICE",
              },
              create: {
                key: currMatchKey,
                tournamentKey: tournamentKey,
                matchNumber: practiceMatchNumber,
                teamNumber: teamNumber,
                matchType: "PRACTICE",
              },
            });
          }
          for (let i = 0; i < match.blueTeams.length; i++) {
            const teamNumber = Number(match.blueTeams[i]);
            const currMatchKey = `${matchKey}_${i + 3}`;

            await prismaClient.teamMatchData.upsert({
              where: {
                key: currMatchKey,
              },
              update: {
                tournamentKey: tournamentKey,
                matchNumber: practiceMatchNumber,
                teamNumber: teamNumber,
                matchType: "PRACTICE",
              },
              create: {
                key: currMatchKey,
                tournamentKey: tournamentKey,
                matchNumber: practiceMatchNumber,
                teamNumber: teamNumber,
                matchType: "PRACTICE",
              },
            });
          }
        }
      }
    }

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
    try {
      matchesResponse = await axios.get(
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

    const playoffMatchOrder = new Map<string, number>([
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

    // For each match in the tournament
    matchesResponse.data.sort(
      (a, b) => (a.actual_time ?? a.time ?? 0) - (b.actual_time ?? b.time ?? 0),
    );

    for (const match of matchesResponse.data) {
      if (match.comp_level == "qm") {
        //all teams in the match
        const teams = [
          ...match.alliances.red.team_keys,
          ...match.alliances.blue.team_keys,
        ];
        let matchesString = ``;
        //make matches with trailing _0, _1, _2 etc
        for (let k = 0; k < teams.length; k++) {
          matchesString =
            matchesString +
            `('${tournamentKey}_qm${match.match_number}_${k}', '${tournamentKey}', ${match.match_number}, '${teams[k]}', '${match.comp_level}'), `;
          const currMatchKey = `${tournamentKey}_qm${match.match_number}_${k}`;

          const fakeTeamKey = teams[k]; // The one TBA sends you which is potentially "fake", like frc6418B
          const mapEntry = Object.entries(remap_teams).find(
            (v) => v[1] === fakeTeamKey,
          );
          const realTeamKey = mapEntry ? mapEntry[0] : fakeTeamKey;
          const currTeam = Number(realTeamKey.substring(3));

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
            },
            create: {
              key: params.data.key,
              tournamentKey: params.data.tournamentKey,
              matchNumber: params.data.matchNumber,
              teamNumber: params.data.teamNumber,
              matchType: "QUALIFICATION",
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
          const mapEntry = Object.entries(remap_teams).find(
            (v) => v[1] === teamKey,
          );
          const realTeamKey = mapEntry ? mapEntry[0] : teamKey;
          const teamNumber = Number(realTeamKey.substring(3));
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
            },
            create: {
              key: params.data.key,
              tournamentKey: params.data.tournamentKey,
              matchNumber: params.data.matchNumber,
              teamNumber: params.data.teamNumber,
              matchType: "ELIMINATION",
            },
          });
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
};
