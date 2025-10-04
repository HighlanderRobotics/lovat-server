import prismaClient from "../../../prismaClient";
// import { cooperationSingleMatch } from "./cooperationSingleMatch";

export const totalPointsScoutingLead = async (
  scoutReportUuid: string,
): Promise<number> => {
  try {
    const points = await prismaClient.event.aggregate({
      where: {
        scoutReportUuid: scoutReportUuid,
      },
      _sum: {
        points: true,
      },
    });
    const totalPoints = points._sum.points || 0;
    //only doing events bc "strikes" will be calculated sepratly
    return totalPoints;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
