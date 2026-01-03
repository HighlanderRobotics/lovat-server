import prismaClient from "../../../prismaClient.js";
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth.js";

//uuid is when editing a shift so it doesnt check that its over lapping with itself
export const checkScouterShiftMatches = async (
  req: AuthenticatedRequest,
  tournamentKey: string,
  currStart: number,
  currEnd: number,
  uuid: string = null,
): Promise<boolean> => {
  try {
    let shifts = [];
    if (uuid) {
      shifts = await prismaClient.scouterScheduleShift.findMany({
        where: {
          tournamentKey: tournamentKey,
          sourceTeamNumber: req.user.teamNumber,
          uuid: {
            not: uuid,
          },
        },
        orderBy: {
          startMatchOrdinalNumber: "asc",
        },
      });
    } else {
      shifts = await prismaClient.scouterScheduleShift.findMany({
        where: {
          tournamentKey: tournamentKey,
          sourceTeamNumber: req.user.teamNumber,
        },
        orderBy: {
          startMatchOrdinalNumber: "asc",
        },
      });
    }

    if (shifts.length === 0) {
      return true;
    }
    for (let i = 0; i < shifts.length; i++) {
      const currShift = shifts[i];
      if (
        i == 0 &&
        currStart < currShift.startMatchOrdinalNumber &&
        currEnd < currShift.startMatchOrdinalNumber
      ) {
        return true;
      } else if (
        currStart > currShift.endMatchOrdinalNumber &&
        i === shifts.length - 1
      ) {
        return true;
      } else if (
        currStart > currShift.endMatchOrdinalNumber &&
        currEnd < shifts[i + 1].startMatchOrdinalNumber
      ) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
