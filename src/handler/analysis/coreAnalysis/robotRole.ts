import { MetricsBreakdown } from "../analysisConstants";
import { User } from "@prisma/client";
import { nonEventMetric } from "./nonEventMetric";

// Finds main robot role for a team
export const robotRole = async (
  user: User,
  team: number,
): Promise<{ mainRole: string }> => {
  try {
    const roles = await nonEventMetric(user, team, MetricsBreakdown.robotRole);

    let eventTypeWithMostOccurrences = null;
    let maxCount = 0;

    // Iterate through robot roles
    for (const [type, count] of Object.entries(roles)) {
      if (count > maxCount) {
        maxCount = count;
        eventTypeWithMostOccurrences = type;
      }
    }

    return {
      mainRole: eventTypeWithMostOccurrences,
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
};
