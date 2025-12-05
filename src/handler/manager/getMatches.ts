import { Response } from "express";
import prismaClient from "../../prismaClient";
import z from "zod";
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";
import { addTournamentMatches } from "./addTournamentMatches";
import {
  MatchTypeMap,
  MatchTypeToAbrivation,
  ReverseMatchTypeMap,
  ReverseScouterScheduleMap,
  ScouterScheduleMap,
} from "./managerConstants";
import {
  dataSourceRuleSchema,
  dataSourceRuleToPrismaFilter,
} from "../analysis/dataSourceRule";

export const getMatches = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const user = req.user;
    let teams = null;
    let isScouted = null;
    //type check, convert isScouted to a boolean
    if (req.query.isScouted != undefined) {
      isScouted = req.query.isScouted === "true";
    }
    if (req.query.teams != undefined) {
      teams = JSON.parse(req.query.teams as string);
    }
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

    //get matches from tournament, check that tournament has been inserted. If not add it
    const matchRows = await prismaClient.teamMatchData.findMany({
      where: {
        tournamentKey: params.data.tournamentKey,
      },
    });
    if (matchRows.length === 0) {
      await addTournamentMatches(params.data.tournamentKey);
    }

    //find scouted matches (using sourceTeam and isScouted )
    //get all matches regarless for ordinal number calculation later on
    const qualMatches = await prismaClient.teamMatchData.findMany({
      where: {
        tournamentKey: params.data.tournamentKey,
        matchType: "QUALIFICATION",
      },
      orderBy: {
        teamNumber: "asc",
      },
    });
    if (qualMatches.length === 0) {
      res
        .status(404)
        .send("The match schedule for this tournament hasn't been posted yet.");
      return;
    }
    const lastQualMatch = Number(qualMatches.length / 6);

    //find non scouted matches (not scouted from user.sourceTeam)
    const notScouted = await prismaClient.teamMatchData.findMany({
      where: {
        tournamentKey: params.data.tournamentKey,
        scoutReports: {
          none: {
            scouter: {
              sourceTeamNumber: dataSourceRuleToPrismaFilter(
                dataSourceRuleSchema(z.number()).parse(req.user.teamSourceRule),
              ),
            },
          },
        },
      },

      orderBy: [{ matchType: "desc" }, { matchNumber: "asc" }],
    });
    //check to make sure each match has 6 rows, if not than 1 + rows have been scouted already
    const groupedMatches = await notScouted.reduce((acc, match) => {
      const key = `${match.matchNumber}-${match.matchType}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(match);
      return acc;
    }, {});

    // find matches with less than 6 rows
    const groupsToKeep = Object.keys(groupedMatches).filter(
      (key) => groupedMatches[key].length >= 6,
    );

    // remove unwanted matches
    const nonScoutedMatches = notScouted.filter((match) => {
      const key = `${match.matchNumber}-${match.matchType}`;
      return groupsToKeep.includes(key);
    });

    const scoutedMatches = await prismaClient.teamMatchData.findMany({
      where: {
        tournamentKey: params.data.tournamentKey,
        key: {
          notIn: nonScoutedMatches.map((item) => item.key),
        },
      },
    });
    //get just the matchNumber + matchType for matches scouted and unscouted speratly
    let matchKeyAndNumber = [];
    if (
      params.data.isScouted === null ||
      params.data.isScouted === undefined ||
      params.data.isScouted
    ) {
      const matchKeyAndNumberScouted = await prismaClient.teamMatchData.groupBy(
        {
          by: ["matchNumber", "matchType"],
          where: {
            tournamentKey: params.data.tournamentKey,
            key: {
              in: scoutedMatches.map((item) => item.key),
            },
          },
          orderBy: [{ matchType: "desc" }, { matchNumber: "asc" }],
        },
      );
      matchKeyAndNumber = matchKeyAndNumber.concat(
        matchKeyAndNumberScouted.map((match) => ({ ...match, scouted: true })),
      );
    }
    if (
      params.data.isScouted === null ||
      params.data.isScouted === undefined ||
      !params.data.isScouted
    ) {
      const matchKeyAndNumberUnScouted =
        await prismaClient.teamMatchData.groupBy({
          by: ["matchNumber", "matchType"],
          where: {
            tournamentKey: params.data.tournamentKey,
            key: {
              in: nonScoutedMatches.map((item) => item.key),
            },
          },
          _count: {
            _all: true,
          },
          orderBy: [{ matchType: "asc" }, { matchNumber: "asc" }],
        });
      matchKeyAndNumber = matchKeyAndNumber.concat(
        matchKeyAndNumberUnScouted.map((match) => ({
          ...match,
          scouted: false,
        })),
      );
    }
    //assuming scouted matches always come before non scouted, add sort to comfim that
    let finalMatches = [];
    if (
      params.data.teamNumbers &&
      params.data.teamNumbers.length > 0 &&
      params.data.teamNumbers.length <= 6
    ) {
      for (const currMatchKeyAndNumber of matchKeyAndNumber) {
        const currMatch = await prismaClient.teamMatchData.findMany({
          where: {
            matchNumber: currMatchKeyAndNumber.matchNumber,
            matchType: currMatchKeyAndNumber.matchType,
            tournamentKey: params.data.tournamentKey,
          },
        });
        const currMatchTeamNumbers = currMatch.map((match) => match.teamNumber);
        const allTeamsPresent = params.data.teamNumbers.every((teamNumber) =>
          currMatchTeamNumbers.includes(teamNumber),
        );
        if (allTeamsPresent) {
          finalMatches.push(currMatchKeyAndNumber);
        }
      }
    } else if (
      params.data.teamNumbers === null ||
      params.data.teamNumbers === undefined ||
      params.data.teamNumbers.length === 0
    ) {
      finalMatches = matchKeyAndNumber;
    }
    //sort
    finalMatches.sort((a, b) => {
      if (a.matchType < b.matchType) return 1;
      if (a.matchType > b.matchType) return -1;
      return a.matchNumber - b.matchNumber;
    });

    const finalFormatedMatches = [];
    //change into proper format once we know all the matches we are including
    for (const element of finalMatches) {
      let currMatch = await prismaClient.teamMatchData.findMany({
        where: {
          matchNumber: element.matchNumber,
          matchType: element.matchType,
          tournamentKey: params.data.tournamentKey,
        },
      });
      if (currMatch.length != 6) {
        res
          .status(400)
          .send(
            `Matches not added correctly, does not have 6 teams for match ${element.matchNumber} of type ${element.matchType}`,
          );
        return;
      }
      //sort by 0, 1, 2, 3, 4, 5 in case its out of order
      currMatch = currMatch.sort((a, b) => {
        const lastDigitA = parseInt(a.key[a.key.length - 1]);
        const lastDigitB = parseInt(b.key[b.key.length - 1]);
        return lastDigitA - lastDigitB;
      });
      const currData = {
        tournamentKey: params.data.tournamentKey,
        matchNumber: element.matchNumber,
        matchType: ReverseMatchTypeMap[element.matchType],
        scouted: element.scouted,
        team1: {
          number: currMatch[0].teamNumber,
          alliance: "red",
          scouters: [],
          externalReports: 0,
        },
        team2: {
          number: currMatch[1].teamNumber,
          alliance: "red",
          scouters: [],
          externalReports: 0,
        },
        team3: {
          number: currMatch[2].teamNumber,
          alliance: "red",
          scouters: [],
          externalReports: 0,
        },
        team4: {
          number: currMatch[3].teamNumber,
          alliance: "blue",
          scouters: [],
          externalReports: 0,
        },
        team5: {
          number: currMatch[4].teamNumber,
          alliance: "blue",
          scouters: [],
          externalReports: 0,
        },
        team6: {
          number: currMatch[5].teamNumber,
          alliance: "blue",
          scouters: [],
          externalReports: 0,
        },
      };
      finalFormatedMatches.push(currData);
    }
    const promises = [];
    if (user.teamNumber) {
      const scouterShifts = await prismaClient.scouterScheduleShift.findMany({
        where: {
          tournamentKey: params.data.tournamentKey,
          sourceTeamNumber: user.teamNumber,
        },
        orderBy: [{ startMatchOrdinalNumber: "asc" }],
        include: {
          team1: true,
          team2: true,
          team3: true,
          team4: true,
          team5: true,
          team6: true,
        },
      });
      if (scouterShifts.length !== 0) {
        for (const element of finalFormatedMatches) {
          let scoutersExist = true;
          //if its an elimination match get the ordinal number, so that we can compare it to the scouterShift start/end
          let matchNumber = element.matchNumber;
          if (element.matchType === 1) {
            matchNumber += lastQualMatch;
          }
          //move onto correct shift
          let currIndex = 0;
          while (scouterShifts[currIndex].endMatchOrdinalNumber < matchNumber) {
            currIndex += 1;
            if (currIndex >= scouterShifts.length) {
              scoutersExist = false;
              break;
            }
          }
          if (
            scoutersExist &&
            scouterShifts[currIndex].startMatchOrdinalNumber > matchNumber
          ) {
            scoutersExist = false;
          }
          if (scoutersExist) {
            promises.push(
              addScoutedTeam(req, scouterShifts, currIndex, "team1", element),
            );
            promises.push(
              addScoutedTeam(req, scouterShifts, currIndex, "team2", element),
            );
            promises.push(
              addScoutedTeam(req, scouterShifts, currIndex, "team3", element),
            );
            promises.push(
              addScoutedTeam(req, scouterShifts, currIndex, "team4", element),
            );
            promises.push(
              addScoutedTeam(req, scouterShifts, currIndex, "team5", element),
            );
            promises.push(
              addScoutedTeam(req, scouterShifts, currIndex, "team6", element),
            );
          } else {
            promises.push(addScoutedTeamNotOnSchedule(req, "team1", element));
            promises.push(addScoutedTeamNotOnSchedule(req, "team2", element));
            promises.push(addScoutedTeamNotOnSchedule(req, "team3", element));
            promises.push(addScoutedTeamNotOnSchedule(req, "team4", element));
            promises.push(addScoutedTeamNotOnSchedule(req, "team5", element));
            promises.push(addScoutedTeamNotOnSchedule(req, "team6", element));
          }
          if (element.scouted) {
            promises.push(addExternalReports(req, element));
          }
        }
      } else {
        for (const match of finalFormatedMatches) {
          promises.push(addScoutedTeamNotOnSchedule(req, "team1", match));
          promises.push(addScoutedTeamNotOnSchedule(req, "team2", match));
          promises.push(addScoutedTeamNotOnSchedule(req, "team3", match));
          promises.push(addScoutedTeamNotOnSchedule(req, "team4", match));
          promises.push(addScoutedTeamNotOnSchedule(req, "team5", match));
          promises.push(addScoutedTeamNotOnSchedule(req, "team6", match));
          if (match.scouted) {
            await addExternalReports(req, match);
          }
        }
      }
    } else {
      for (const match of finalFormatedMatches) {
        promises.push(addExternalReports(req, match));
      }
    }

    await Promise.all(promises);

    res.status(200).send(finalFormatedMatches);
  } catch (error) {
    res.status(500).send(error);
  }
};
//problem: will push to all 6 teams
async function addScoutedTeamNotOnSchedule(
  req: AuthenticatedRequest,
  team: string,
  match,
  scouterShifts = null,
  currIndex = -1,
) {
  try {
    const key =
      match.tournamentKey +
      "_" +
      MatchTypeToAbrivation[match.matchType] +
      match.matchNumber +
      "_" +
      ReverseScouterScheduleMap[team];
    if (scouterShifts !== null && currIndex !== -1) {
      const rows = await prismaClient.scoutReport.findMany({
        where: {
          teamMatchData: {
            key: key,
          },
          scouterUuid: {
            notIn: scouterShifts[currIndex][team].map((item) => item.uuid),
          },
          scouter: {
            sourceTeamNumber: req.user.teamNumber,
          },
        },
        include: {
          scouter: true,
        },
      });
      for (const scoutReport of rows) {
        await match[team].scouters.push({
          name: scoutReport.scouter.name,
          scouted: true,
        });
      }
    } else {
      const rows = await prismaClient.scoutReport.findMany({
        where: {
          teamMatchData: {
            key: key,
          },
          scouter: {
            sourceTeamNumber: req.user.teamNumber,
          },
        },
        include: {
          scouter: true,
        },
      });

      for (const scoutReport of rows) {
        await match[team].scouters.push({
          name: scoutReport.scouter.name,
          scouted: true,
        });
      }
    }
    return true;
  } catch (error) {
    throw error;
  }
}

async function addScoutedTeam(
  req: AuthenticatedRequest,
  scouterShifts,
  currIndex: number,
  team: string,
  match,
) {
  try {
    const key =
      match.tournamentKey +
      "_" +
      MatchTypeToAbrivation[match.matchType] +
      match.matchNumber +
      "_" +
      ReverseScouterScheduleMap[team];
    for (const scouter of scouterShifts[currIndex][team]) {
      const rows = await prismaClient.scoutReport.findMany({
        where: {
          scouterUuid: scouter.uuid,
          teamMatchKey: key,
        },
      });
      if (rows !== null && rows.length > 0) {
        for (const element of rows) {
          await match[team].scouters.push({
            name: scouter.name,
            scouted: true,
          });
        }
      } else {
        await match[team].scouters.push({ name: scouter.name, scouted: false });
      }
    }
    await addScoutedTeamNotOnSchedule(
      req,
      team,
      match,
      scouterShifts,
      currIndex,
    );
    return true;
  } catch (error) {
    throw error;
  }
}
async function addExternalReports(req: AuthenticatedRequest, match) {
  //don't use null for "not" in prisma below
  const teamNumber = req.user.teamNumber || 0;
  const externalReports = await prismaClient.scoutReport.groupBy({
    by: ["teamMatchKey"],
    _count: {
      _all: true,
    },
    where: {
      teamMatchData: {
        tournamentKey: match.tournamentKey,
        matchType: MatchTypeMap[match.matchType],
        matchNumber: match.matchNumber,
      },
      scouter: {
        sourceTeamNumber: dataSourceRuleToPrismaFilter(
          dataSourceRuleSchema(z.number()).parse(req.user.teamSourceRule),
        ),
      },
    },
  });

  await externalReports.forEach((externalReport) => {
    const team =
      ScouterScheduleMap[
        externalReport.teamMatchKey[externalReport.teamMatchKey.length - 1]
      ];
    match[team].externalReports = externalReport._count._all;
  });
  return true;
}
