import { Request, Response } from "express";
import prismaClient from "../../prismaClient";
import z from "zod";
import { MatchTypeMap, ScouterScheduleMap } from "./managerConstants";
import SHA256 from "crypto-js/sha256";
import { addTournamentMatches } from "./addTournamentMatches";

export const getScheduleForScouter = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const params = z
      .object({
        code: z.string(),
        tournamentKey: z.string(),
      })
      .safeParse({
        code: req.headers["x-team-code"],
        tournamentKey: req.params.tournament,
      });

    if (!params.success) {
      res.status(400).send({
        error: params,
        displayError:
          "Invalid input. Make sure you are using the correct input.",
      });
      return;
    }
    const teamRow = await prismaClient.registeredTeam.findUnique({
      where: {
        code: params.data.code,
      },
    });
    if (!teamRow) {
      res.status(400).send("Provided code is not affiliated with a team");
      return;
    }
    const rows = await prismaClient.scouterScheduleShift.findMany({
      where: {
        sourceTeamNumber: teamRow.number,
        tournamentKey: params.data.tournamentKey,
      },
      include: {
        team1: true,
        team2: true,
        team3: true,
        team4: true,
        team5: true,
        team6: true,
      },
      orderBy: {
        startMatchOrdinalNumber: "asc",
      },
    });
    const maxQualifierRow = await prismaClient.teamMatchData.findFirst({
      where: {
        tournamentKey: params.data.tournamentKey,
        matchType: "QUALIFICATION",
      },
      orderBy: {
        matchNumber: "desc",
      },
    });
    if (maxQualifierRow === null) {
      await addTournamentMatches(params.data.tournamentKey);
    }
    if (maxQualifierRow === null) {
      res.status(400).send({
        error: "Matches are not available for this tournamnet",
        displayError: "Matches are not available for this tournament",
      });
      return;
    }
    const highestQualificationMatchNumber = maxQualifierRow.matchNumber;
    const finalArr = [];
    for (const element of rows) {
      for (
        let i = element.startMatchOrdinalNumber;
        i <= element.endMatchOrdinalNumber;
        i++
      ) {
        let matchNumber = i;
        let matchType = 0;
        if (i > highestQualificationMatchNumber) {
          matchNumber = i - highestQualificationMatchNumber;
          matchType = 1;
        }

        const currData = {
          matchType: matchType,
          matchNumber: matchNumber,
        };

        const matchRows = await prismaClient.teamMatchData.findMany({
          where: {
            tournamentKey: params.data.tournamentKey,
            matchNumber: matchNumber,
            matchType: MatchTypeMap[matchType],
          },
          orderBy: {
            key: "asc",
          },
        });
        //if its 0 just skipp over
        if (matchRows.length !== 6 && matchRows.length > 0) {
          //could be a server issue or an ordinal number problem
          res.status(400).send("Match has not imported correctly");
          return;
        }
        if (matchRows.length === 6) {
          const scouterMap = {};
          for (let j = 0; j < 6; j++) {
            for (const scouter of element[ScouterScheduleMap[j]]) {
              if (j <= 2) {
                scouterMap[scouter.uuid] = {
                  team: matchRows[j].teamNumber,
                  alliance: "red",
                };
              } else {
                scouterMap[scouter.uuid] = {
                  team: matchRows[j].teamNumber,
                  alliance: "blue",
                };
              }
            }
          }
          currData["scouters"] = scouterMap;
          finalArr.push(currData);
        }
      }
    }

    // console.log(finalArr)

    res.status(200).send({ hash: hashJsonObject(rows), data: finalArr });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: error, displayError: "error" });
  }
};
function hashJsonObject(json: object): string {
  const jsonString = JSON.stringify(json);

  const hash = SHA256(jsonString);

  return hash.toString();
}
