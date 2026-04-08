import { describe, it, expect, vi } from "vitest";

// Mock external dependencies to avoid DB connections
vi.mock("../../../prismaClient.js", () => ({
  default: {
    $queryRawUnsafe: vi.fn().mockResolvedValue([]),
    team: { findMany: vi.fn().mockResolvedValue([]) },
    tournament: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

vi.mock("../../../redisClient.js", () => ({
  kv: { get: vi.fn(), set: vi.fn(), del: vi.fn(), flush: vi.fn() },
}));

vi.mock("../analysisFunction.js", () => ({
  runAnalysis: vi.fn(),
}));

import { transformBreakdown } from "./nonEventMetric.js";

describe("transformBreakdown", () => {
  it("returns 'TRUE' for boolean true", () => {
    expect(transformBreakdown(true)).toBe("TRUE");
  });

  it("returns 'FALSE' for boolean false", () => {
    expect(transformBreakdown(false)).toBe("FALSE");
  });

  it("passes through string values unchanged", () => {
    expect(transformBreakdown("CYCLING")).toBe("CYCLING");
    expect(transformBreakdown("DEFENDING")).toBe("DEFENDING");
    expect(transformBreakdown("IMMOBILE")).toBe("IMMOBILE");
  });

  it("passes through null unchanged", () => {
    expect(transformBreakdown(null)).toBeNull();
  });

  it("passes through undefined unchanged", () => {
    expect(transformBreakdown(undefined)).toBeUndefined();
  });

  it("passes through numeric values unchanged", () => {
    expect(transformBreakdown(0)).toBe(0);
    expect(transformBreakdown(42)).toBe(42);
  });

  it("passes through enum-like strings as-is", () => {
    expect(transformBreakdown("NOT_ATTEMPTED")).toBe("NOT_ATTEMPTED");
    expect(transformBreakdown("SUCCEEDED")).toBe("SUCCEEDED");
  });
});
