import prismaClient from '../../../prismaClient';
import { User } from '@prisma/client';
import { MetricsBreakdown } from '../analysisConstants';

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

  
    const query = `
      SELECT s."${columnName}" AS value,
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

    const rows: QueryRow[] = await prismaClient.$queryRawUnsafe(
      query,
      team,
      user.tournamentSource,
      user.teamSource
    );

    const result: Record<string, number> = {};
    for (const row of rows) {
      result[row.value] = parseFloat(row.percentage);
    }

    return result;
  } catch (error) {
    console.error('Error in nonEventMetric:', error);
    throw error;
  }
};
