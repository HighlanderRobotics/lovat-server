import prismaClient from '../../../prismaClient'
import { AlgaePickup, BargeResult, CoralPickup, KnocksAlgae, RobotRole, UnderShallowCage, User } from "@prisma/client";
import { MetricsBreakdown } from "../analysisConstants";

/**
 * Optimized function: Returns a mapping of each distinct (lowercased) metric value to its percentage,
 * calculated directly in the database with a single query.
 */
export const nonEventMetric = async (
  user: User,
  team: number,
  metric: MetricsBreakdown
): Promise<Record<string, number>> => {
  try {
    const columnName =
      metric === MetricsBreakdown.knocksAlgae
        ? 'knocksAlgae'
        : metric === MetricsBreakdown.robotRole
          ? 'robotRole'
          : metric === MetricsBreakdown.underShallowCage
            ? 'underShallowCage'
            : metric === MetricsBreakdown.bargeResult
              ? 'bargeResult'
              : metric === MetricsBreakdown.coralPickup
                ? 'coralPickup'
                : metric === MetricsBreakdown.algaePickup
                  ? 'algaePickup'
                  : null

    // const allowedColumns = ['knocksAlgae', /* 'anotherMetric', etc. */];
    // if (!allowedColumns.includes(columnName)) {
    //   throw new Error(`Invalid metric column: ${columnName}`);
    // }

    const allowedMapping: Record<string, Record<string, string>> = {
      robotRole: RobotRole,
      coralPickup: CoralPickup, 
      bargeResult : BargeResult,
     algaePickup : AlgaePickup,
     underShallowCage : UnderShallowCage,
     knocksAlgae : KnocksAlgae
    };

    const allowedOptionsObj = allowedMapping[columnName];

    
    const result: Record<string, number> = {};
    Object.keys(allowedOptionsObj).forEach(option => {
      result[option] = 0;
    });

    const query = `
      SELECT "${columnName}" AS value,
             COUNT(s."scouterUuid") AS count,
             COUNT(s."scouterUuid")::numeric / SUM(COUNT(s."scouterUuid")) OVER () AS percentage
      FROM "ScoutReport" s
      JOIN "TeamMatchData" tmd ON tmd."key" = s."teamMatchKey"
      JOIN "Scouter" sc ON sc."uuid" = s."scouterUuid"
      WHERE tmd."teamNumber" = $1
        AND tmd."tournamentKey" = ANY($2)
        AND sc."sourceTeamNumber" = ANY($3)
      GROUP BY s."${columnName}"
    `;

    interface QueryRow {
      value: string;
      count: string;
      percentage: string;
    }
    const transformOption = (option: string): string => {
      const upper = option.toUpperCase();
      if (upper === "YES") return "true";
      if (upper === "NO") return "false";
      return upper;
    };
    const rows: QueryRow[] = await prismaClient.$queryRawUnsafe(
      query,
      team,
      user.tournamentSource,
      user.teamSource
    );
    for (const row of rows) {
      const option = transformOption(row.value);
      result[option] = parseFloat(row.percentage);
    }

    return result;
  } catch (error) {
    console.error('Error in nonEventMetric:', error);
    throw error;
  }
}
