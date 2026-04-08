import { describe, it, expect, vi } from "vitest";

// Mock prismaClient and redisClient to prevent connections in tests
vi.mock("../../../prismaClient.js", () => ({
  default: {
    teamMatchData: { findMany: vi.fn().mockResolvedValue([]) },
    team: { findMany: vi.fn().mockResolvedValue([]) },
    tournament: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

vi.mock("../../../redisClient.js", () => ({
  kv: { get: vi.fn(), set: vi.fn(), del: vi.fn(), flush: vi.fn() },
}));

vi.mock("../analysisConstants.js", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("../analysisConstants.js")
  >();
  return {
    ...actual,
    allTournaments: Promise.resolve([]),
  };
});

import { avg, calculateTimeMetric } from "./averageManyFast.js";

describe("avg", () => {
  it("returns 0 for an empty array", () => {
    expect(avg([])).toBe(0);
  });

  it("returns the single value for a one-element array", () => {
    expect(avg([42])).toBe(42);
  });

  it("returns the correct average of multiple values", () => {
    expect(avg([10, 20, 30])).toBe(20);
  });

  it("returns the correct average with fractional result", () => {
    expect(avg([1, 2])).toBe(1.5);
  });

  it("handles negative values", () => {
    expect(avg([-10, 10])).toBe(0);
  });

  it("handles all zero values", () => {
    expect(avg([0, 0, 0])).toBe(0);
  });

  it("handles large arrays correctly", () => {
    const values = Array.from({ length: 100 }, (_, i) => i + 1);
    expect(avg(values)).toBe(50.5);
  });
});

describe("calculateTimeMetric", () => {
  const makeEvent = (action: string, time: number) => ({
    eventUuid: `uuid-${action}-${time}`,
    time,
    action: action as any,
    position: "NONE" as any,
    points: 0,
    scoutReportUuid: "report-uuid",
  });

  it("returns [0] for a report with no events", () => {
    const result = calculateTimeMetric([{ events: [] }], "FEEDING");
    expect(result).toEqual([0]);
  });

  it("calculates duration of a single START/STOP pair", () => {
    const events = [
      makeEvent("START_FEEDING", 10),
      makeEvent("STOP_FEEDING", 15),
    ];
    const result = calculateTimeMetric([{ events }], "FEEDING");
    expect(result).toEqual([5]);
  });

  it("calculates total duration of multiple START/STOP pairs", () => {
    const events = [
      makeEvent("START_FEEDING", 10),
      makeEvent("STOP_FEEDING", 15),
      makeEvent("START_FEEDING", 20),
      makeEvent("STOP_FEEDING", 25),
    ];
    const result = calculateTimeMetric([{ events }], "FEEDING");
    expect(result).toEqual([10]);
  });

  it("ignores pairs whose duration is below minActionDuration (0.5s)", () => {
    const events = [
      makeEvent("START_FEEDING", 10),
      makeEvent("STOP_FEEDING", 10.3), // duration = 0.3 < 0.5, should be ignored
    ];
    const result = calculateTimeMetric([{ events }], "FEEDING");
    expect(result).toEqual([0]);
  });

  it("includes pairs that meet minActionDuration exactly (0.5s)", () => {
    const events = [
      makeEvent("START_FEEDING", 10),
      makeEvent("STOP_FEEDING", 10.5), // duration = 0.5, should be included
    ];
    const result = calculateTimeMetric([{ events }], "FEEDING");
    expect(result).toEqual([0.5]);
  });

  it("handles multiple scout reports independently", () => {
    const events1 = [
      makeEvent("START_DEFENDING", 5),
      makeEvent("STOP_DEFENDING", 15),
    ];
    const events2 = [
      makeEvent("START_DEFENDING", 20),
      makeEvent("STOP_DEFENDING", 30),
    ];
    const result = calculateTimeMetric(
      [{ events: events1 }, { events: events2 }],
      "DEFENDING",
    );
    expect(result).toEqual([10, 10]);
  });

  it("returns [0] for a report with mismatched events (single START only)", () => {
    // Only start, no stop - the pairing logic won't pair anything
    const events = [makeEvent("START_FEEDING", 10)];
    const result = calculateTimeMetric([{ events }], "FEEDING");
    expect(result).toEqual([0]);
  });

  it("returns [0] when events array is empty", () => {
    const result = calculateTimeMetric([{ events: [] }], "SCORING");
    expect(result).toEqual([0]);
  });

  it("correctly handles events for SCORING action", () => {
    const events = [
      makeEvent("START_SCORING", 30),
      makeEvent("STOP_SCORING", 50),
    ];
    const result = calculateTimeMetric([{ events }], "SCORING");
    expect(result).toEqual([20]);
  });

  it("sorts events by time before pairing", () => {
    // Events are out of order; should still pair correctly after sorting
    const events = [
      makeEvent("STOP_FEEDING", 15),
      makeEvent("START_FEEDING", 10),
    ];
    const result = calculateTimeMetric([{ events }], "FEEDING");
    expect(result).toEqual([5]);
  });
});
