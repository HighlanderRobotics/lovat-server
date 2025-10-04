import prismaClient from "../../prismaClient";
import z from "zod";
import axios from "axios";

export const addTournamentMatches = async (tournamentKey) => {
  try {
    if (tournamentKey === undefined) {
      throw "tournament key is undefined";
    }

    const url = "https://www.thebluealliance.com/api/v3";
    let nonQM = 1;
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

    const matchesResponse = await axios.get(
      `${url}/event/${tournamentKey}/matches`,
      {
        headers: { "X-TBA-Auth-Key": process.env.TBA_KEY },
      }
    );

    // For each match in the tournament
    matchesResponse.data.sort((a, b) => b.actual_time - a.actual_time);

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
            `('${match.key}_${k}', '${tournamentKey}', ${match.match_number}, '${teams[k]}', '${match.comp_level}'), `;
          const currMatchKey = `${match.key}_${k}`;

          const fakeTeamKey = teams[k]; // The one TBA sends you which is potentially "fake", like frc6418B
          const mapEntry = Object.entries(remap_teams).find(
            (v) => v[1] === fakeTeamKey
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

        for (let k = 0; k < 6; k++) {
          const currTeam = Number(teams[k].substring(3));

          const currMatchKey = `${tournamentKey}_em${nonQM}_${k}`;

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
              matchNumber: nonQM,
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
        nonQM += 1;
      }
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
};
