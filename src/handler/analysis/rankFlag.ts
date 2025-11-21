import axios from "axios";
import z from "zod";
import { createAnalysisFunction } from "./analysisFunction";

export async function computeRankFlag(
  eventKey: string,
  teams: number[],
): Promise<Record<number, number>> {
  try {
    const response = await axios.get(
      `https://www.thebluealliance.com/api/v3/event/${eventKey}/rankings`,
      { headers: { "X-TBA-Auth-Key": process.env.TBA_KEY } },
    );
    const rankings: { team_key: string; rank: number }[] =
      response.data.rankings;

    const out: Record<number, number> = {};
    for (const team of teams) {
      const i = rankings.findIndex((val) => val.team_key === "frc" + team);
      out[team] = i === -1 ? 0 : rankings[i].rank;
    }
    return out;
  } catch {
    const out: Record<number, number> = {};
    for (const team of teams) out[team] = 0;
    return out;
  }
}

/** Returns list of ranks by team. Invalid ranks are returned as 0 */
export const rankFlag = createAnalysisFunction({
  argsSchema: z.object({ eventKey: z.string(), teams: z.array(z.number()) }),
  returnSchema: z.record(z.string(), z.number()),
  usesDataSource: false,
  shouldCache: true,
  createKey: (args) => ({
    key: [
      "rankFlag",
      args.eventKey,
      JSON.stringify([...args.teams].sort((a, b) => a - b)),
    ],
  }),
  calculateAnalysis: async (args) => {
    const out = await computeRankFlag(args.eventKey, args.teams);
    return out as unknown as Record<string, number>;
  },
});
