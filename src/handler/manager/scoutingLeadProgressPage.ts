import { Response } from "express";
import prismaClient from "../../prismaClient";
import z from "zod";
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";

export const scoutingLeadProgressPage = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const params = z
      .object({
        tournamentKey: z.string().nullable(),
        archived: z.string().transform(val => val === 'true').optional()
      })
      .safeParse({
        tournamentKey: req.query.tournamentKey || null,
      });
    if (!params.success) {
      res.status(400).send(params);
      return;
    }
    if (req.user.teamNumber === null) {
      res.status(400).send("Not affilated with a team");
      return;
    }
    if (req.user.role !== "SCOUTING_LEAD") {
      res.status(400).send("Not a scouting lead");
      return;
    }

    if (params.data.tournamentKey) {
      const matchesAtTournamentRows = await prismaClient.teamMatchData.groupBy({
        by: ["matchType", "matchNumber"],
        where: {
          tournamentKey: params.data.tournamentKey,
          scoutReports: {
            some: {},
          },
        },
      });
      const totalTournamentMatches = matchesAtTournamentRows.length;
      const scouters = await prismaClient.scouter.findMany({
        where: {
          sourceTeamNumber: req.user.teamNumber,
          archived: params.data.archived
        },
        include: {
          scoutReports: true,
          team1Shifts: {
            where: {
              tournamentKey: params.data.tournamentKey,
              startMatchOrdinalNumber: {
                lte: totalTournamentMatches,
              },
            },
          },
          team2Shifts: {
            where: {
              tournamentKey: params.data.tournamentKey,
              startMatchOrdinalNumber: {
                lte: totalTournamentMatches,
              },
            },
          },
          team3Shifts: {
            where: {
              tournamentKey: params.data.tournamentKey,
              startMatchOrdinalNumber: {
                lte: totalTournamentMatches,
              },
            },
          },
          team4Shifts: {
            where: {
              tournamentKey: params.data.tournamentKey,
              startMatchOrdinalNumber: {
                lte: totalTournamentMatches,
              },
            },
          },
          team5Shifts: {
            where: {
              tournamentKey: params.data.tournamentKey,
              startMatchOrdinalNumber: {
                lte: totalTournamentMatches,
              },
            },
          },
          team6Shifts: {
            where: {
              tournamentKey: params.data.tournamentKey,
              startMatchOrdinalNumber: {
                lte: totalTournamentMatches,
              },
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      });

      const result = [];
      for (const scouter of scouters) {
        const allShifts = [
          ...scouter.team1Shifts,
          ...scouter.team2Shifts,
          ...scouter.team3Shifts,
          ...scouter.team4Shifts,
          ...scouter.team5Shifts,
          ...scouter.team6Shifts,
        ];

        // iterate over all shifts and sum total assigned matches
        let totalAssignedScouterMatches = 0;
        allShifts.forEach((shift) => {
          const matchesForShift =
            shift.endMatchOrdinalNumber - shift.startMatchOrdinalNumber + 1;
          if (shift.endMatchOrdinalNumber > totalTournamentMatches) {
            totalAssignedScouterMatches +=
              totalTournamentMatches - shift.startMatchOrdinalNumber + 1;
          } else {
            totalAssignedScouterMatches += matchesForShift;
          }
        });
        console.log(scouter.name);
        console.log("totalAssinged");
        console.log(totalAssignedScouterMatches);
        const matchesScoutedAtTournament =
          await prismaClient.scoutReport.groupBy({
            by: ["teamMatchKey"],
            where: {
              scouterUuid: scouter.uuid,
              teamMatchData: {
                tournamentKey: params.data.tournamentKey,
              },
            },
          });

        console.log("matches scouted");
        console.log(matchesScoutedAtTournament.length);
        const currData = {
          scouterUuid: scouter.uuid,
          scouterName: scouter.name,
          matchesScouted: matchesScoutedAtTournament.length,
          missedMatches: Math.max(
            0,
            totalAssignedScouterMatches - matchesScoutedAtTournament.length,
          ),
        };
        result.push(currData);
      }

      res.status(200).send(result);
    } else {
      const scouters = await prismaClient.scouter.findMany({
        where: {
          sourceTeamNumber: req.user.teamNumber,
          archived: params.data.archived
        },
        include: {
          scoutReports: true,
        },
        orderBy: {
          name: "asc",
        },
      });
      const formattedScouters = scouters.map((scouter) => ({
        scouterUuid: scouter.uuid,
        scouterName: scouter.name,
        matchesScouted: scouter.scoutReports.length,
        missedMatches: 0,
      }));
      res.status(200).send(formattedScouters);
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};
