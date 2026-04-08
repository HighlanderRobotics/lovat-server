import { describe, it, expect, vi } from "vitest";

// Mock external dependencies
vi.mock("../../../prismaClient.js", () => ({
  default: {
    teamMatchData: { findMany: vi.fn().mockResolvedValue([]) },
    cachedAnalysis: {
      create: vi.fn().mockResolvedValue({}),
      findMany: vi.fn().mockResolvedValue([]),
    },
    team: { findMany: vi.fn().mockResolvedValue([]) },
    tournament: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

vi.mock("../../../redisClient.js", () => ({
  kv: { get: vi.fn(), set: vi.fn(), del: vi.fn(), flush: vi.fn() },
}));

vi.mock("../coreAnalysis/arrayAndAverageTeams.js", () => ({
  arrayAndAverageTeams: vi.fn(),
}));

import { getZPercent, getMean, getSDV } from "./matchPredictionLogic.js";

describe("getMean", () => {
  it("returns the correct mean of a simple array", () => {
    expect(getMean([1, 2, 3, 4, 5])).toBe(3);
  });

  it("returns the value itself for a single-element array", () => {
    expect(getMean([7])).toBe(7);
  });

  it("returns 0 for an array of zeros", () => {
    expect(getMean([0, 0, 0])).toBe(0);
  });

  it("handles negative values correctly", () => {
    expect(getMean([-10, 10])).toBe(0);
  });

  it("handles fractional results", () => {
    expect(getMean([1, 2])).toBe(1.5);
  });

  it("handles large arrays", () => {
    const values = Array.from({ length: 100 }, (_, i) => i + 1);
    expect(getMean(values)).toBe(50.5);
  });
});

describe("getSDV", () => {
  it("returns 0 for a uniform array (all same values)", () => {
    expect(getSDV([5, 5, 5, 5])).toBe(0);
  });

  it("returns the correct population standard deviation", () => {
    // Mean = 3, variance = ((1-3)^2 + (2-3)^2 + (3-3)^2 + (4-3)^2 + (5-3)^2) / 5 = (4+1+0+1+4)/5 = 2
    // std = sqrt(2) ≈ 1.4142
    expect(getSDV([1, 2, 3, 4, 5])).toBeCloseTo(Math.sqrt(2));
  });

  it("returns 0 for a single element", () => {
    expect(getSDV([42])).toBe(0);
  });

  it("is non-negative for any input", () => {
    expect(getSDV([10, 100, 1000])).toBeGreaterThanOrEqual(0);
  });

  it("returns a larger value for more spread data", () => {
    const tight = getSDV([9, 10, 11]);
    const spread = getSDV([0, 10, 20]);
    expect(spread).toBeGreaterThan(tight);
  });
});

describe("getZPercent", () => {
  it("returns approximately 0 for z <= -6.5", () => {
    expect(getZPercent(-6.5)).toBeCloseTo(0.0, 5);
    expect(getZPercent(-10)).toBe(0.0);
  });

  it("returns approximately 1 for z >= 6.5", () => {
    expect(getZPercent(6.5)).toBeCloseTo(1.0, 5);
    expect(getZPercent(10)).toBe(1.0);
  });

  it("returns approximately 0.5 for z = 0 (symmetric distribution)", () => {
    expect(getZPercent(0)).toBeCloseTo(0.5, 5);
  });

  it("returns greater than 0.5 for positive z", () => {
    expect(getZPercent(1)).toBeGreaterThan(0.5);
  });

  it("returns less than 0.5 for negative z", () => {
    expect(getZPercent(-1)).toBeLessThan(0.5);
  });

  it("is symmetric: P(z) + P(-z) ≈ 1", () => {
    const z = 1.5;
    expect(getZPercent(z) + getZPercent(-z)).toBeCloseTo(1.0, 5);
  });

  it("returns approximately 0.8413 for z = 1 (one sigma)", () => {
    expect(getZPercent(1)).toBeCloseTo(0.8413, 2);
  });

  it("returns approximately 0.9772 for z = 2 (two sigma)", () => {
    expect(getZPercent(2)).toBeCloseTo(0.9772, 2);
  });
});
