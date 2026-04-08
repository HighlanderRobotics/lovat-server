import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock external dependencies
vi.mock("../../../prismaClient.js", () => ({
  default: {
    team: { findMany: vi.fn().mockResolvedValue([]) },
    tournament: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

vi.mock("../rankFlag.js", () => ({
  computeRankFlag: vi.fn(),
}));

import { zScoreMany } from "./zScoreMany.js";
import { computeRankFlag } from "../rankFlag.js";
import { Metric } from "../analysisConstants.js";

const mockComputeRankFlag = vi.mocked(computeRankFlag);

describe("zScoreMany", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an array with one entry per team", async () => {
    const teams = [100, 200, 300];
    const data: Partial<Record<Metric, Record<number, number>>> = {
      [Metric.totalPoints]: { 100: 50, 200: 60, 300: 70 },
    };
    const results = await zScoreMany(data, teams, "2024test", { totalPoints: 1 }, []);
    expect(results).toHaveLength(3);
    expect(results.map((r) => r.team).sort()).toEqual([100, 200, 300]);
  });

  it("includes a breakdown entry for each queried picklist metric", async () => {
    const teams = [100, 200];
    const data: Partial<Record<Metric, Record<number, number>>> = {
      [Metric.totalPoints]: { 100: 40, 200: 80 },
    };
    const results = await zScoreMany(data, teams, "2024test", { totalPoints: 1 }, []);
    for (const r of results) {
      expect(r.breakdown.map((b) => b.type)).toContain("totalPoints");
    }
  });

  it("assigns a higher z-score to the team with higher points", async () => {
    const teams = [100, 200];
    const data: Partial<Record<Metric, Record<number, number>>> = {
      [Metric.totalPoints]: { 100: 20, 200: 80 },
    };
    const results = await zScoreMany(data, teams, "2024test", { totalPoints: 1 }, []);
    const result100 = results.find((r) => r.team === 100)!;
    const result200 = results.find((r) => r.team === 200)!;
    expect(result200.result).toBeGreaterThan(result100.result);
  });

  it("sums up the total result from all weighted breakdown entries", async () => {
    const teams = [100, 200];
    const data: Partial<Record<Metric, Record<number, number>>> = {
      [Metric.totalPoints]: { 100: 50, 200: 50 },
    };
    // Both teams have the same value so z-score should be 0 for both
    const results = await zScoreMany(data, teams, "2024test", { totalPoints: 1 }, []);
    for (const r of results) {
      expect(r.result).toBe(0);
    }
  });

  it("includes unweighted z-score entries", async () => {
    const teams = [100, 200];
    const data: Partial<Record<Metric, Record<number, number>>> = {
      [Metric.totalPoints]: { 100: 20, 200: 80 },
    };
    const results = await zScoreMany(data, teams, "2024test", { totalPoints: 2 }, []);
    // unweighted should have the same type
    for (const r of results) {
      expect(r.unweighted.map((u) => u.type)).toContain("totalPoints");
    }
    // weighted result = unweighted * weight (2)
    const r100 = results.find((r) => r.team === 100)!;
    const breakdown = r100.breakdown.find((b) => b.type === "totalPoints")!;
    const unweighted = r100.unweighted.find((u) => u.type === "totalPoints")!;
    expect(breakdown.result).toBeCloseTo(unweighted.result * 2, 5);
  });

  it("returns flags for category metrics when included in flags list", async () => {
    const teams = [100, 200];
    const data: Partial<Record<Metric, Record<number, number>>> = {
      [Metric.totalPoints]: { 100: 30, 200: 70 },
    };
    const results = await zScoreMany(
      data,
      teams,
      "2024test",
      { totalPoints: 1 },
      ["totalPoints"],
    );
    for (const r of results) {
      const flagTypes = r.flags.map((f) => f.type);
      expect(flagTypes).toContain("totalPoints");
    }
  });

  it("calls computeRankFlag and attaches rank flag when 'rank' is in flags", async () => {
    mockComputeRankFlag.mockResolvedValue({ 100: 2, 200: 1 });
    const teams = [100, 200];
    const data: Partial<Record<Metric, Record<number, number>>> = {
      [Metric.totalPoints]: { 100: 50, 200: 50 },
    };
    const results = await zScoreMany(data, teams, "2024event", { totalPoints: 1 }, ["rank"]);
    expect(mockComputeRankFlag).toHaveBeenCalledWith("2024event", teams);
    const r100 = results.find((r) => r.team === 100)!;
    const rankFlag = r100.flags.find((f) => f.type === "rank");
    expect(rankFlag).toBeDefined();
    expect(rankFlag!.result).toBe(2);
  });

  it("does not call computeRankFlag when 'rank' is not in flags", async () => {
    const teams = [100, 200];
    const data: Partial<Record<Metric, Record<number, number>>> = {
      [Metric.totalPoints]: { 100: 50, 200: 50 },
    };
    await zScoreMany(data, teams, "2024event", { totalPoints: 1 }, []);
    expect(mockComputeRankFlag).not.toHaveBeenCalled();
  });

  it("returns an empty array when no teams are provided", async () => {
    const results = await zScoreMany({}, [], "2024test", {}, []);
    expect(results).toEqual([]);
  });

  it("applies weight scaling correctly: weight 2 doubles the z-score contribution", async () => {
    const teams = [100, 200, 300];
    const data: Partial<Record<Metric, Record<number, number>>> = {
      [Metric.totalPoints]: { 100: 10, 200: 20, 300: 30 },
    };
    const [resultsW1, resultsW2] = await Promise.all([
      zScoreMany(data, teams, "2024test", { totalPoints: 1 }, []),
      zScoreMany(data, teams, "2024test", { totalPoints: 2 }, []),
    ]);
    for (let i = 0; i < teams.length; i++) {
      const w1Team = resultsW1.find((r) => r.team === teams[i])!;
      const w2Team = resultsW2.find((r) => r.team === teams[i])!;
      expect(w2Team.result).toBeCloseTo(w1Team.result * 2, 5);
    }
  });
});
