import { describe, it, expect, vi } from "vitest";

// Mock all external I/O before importing the module under test
vi.mock("../../../prismaClient.js", () => ({
  default: {
    scouter: { findFirstOrThrow: vi.fn() },
    scoutReport: { create: vi.fn(), delete: vi.fn(), findFirst: vi.fn() },
    teamMatchData: { findFirst: vi.fn() },
    event: { createMany: vi.fn() },
    team: { findMany: vi.fn().mockResolvedValue([]) },
    tournament: { findMany: vi.fn().mockResolvedValue([]) },
    cachedAnalysis: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

vi.mock("../../../redisClient.js", () => ({
  kv: { get: vi.fn(), set: vi.fn(), del: vi.fn(), flush: vi.fn() },
}));

vi.mock("../addTournamentMatches.js", () => ({
  addTournamentMatches: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../slack/sendWarningNotification.js", () => ({
  sendWarningToSlack: vi.fn(),
}));

vi.mock("../../../lib/clearCache.js", () => ({
  invalidateCache: vi.fn().mockResolvedValue(undefined),
}));

import {
  removeOrphanedStartEvents,
  checkForInvalidEvents,
} from "./addScoutReport.js";

// EventActionMap (mirrored here for test data)
// 0=START_SCORING, 1=STOP_SCORING, 2=START_MATCH,
// 3=START_CAMPING, 4=STOP_CAMPING,
// 5=START_DEFENDING, 6=STOP_DEFENDING,
// 7=INTAKE, 8=OUTTAKE, 9=DISRUPT, 10=CROSS, 11=CLIMB,
// 12=START_FEEDING, 13=STOP_FEEDING

describe("removeOrphanedStartEvents", () => {
  it("returns events unchanged when app version is not in the malformed set", () => {
    const events = [
      [10, 0, 2], // START_SCORING
      [15, 1, 2], // STOP_SCORING
      [20, 12, 2], // START_FEEDING
    ];
    // Normal version → no filtering
    expect(removeOrphanedStartEvents(events, "26.0.2")).toEqual(events);
  });

  it("returns events unchanged when appVersion is undefined", () => {
    const events = [
      [10, 0, 2],
      [15, 1, 2],
    ];
    expect(removeOrphanedStartEvents(events, undefined)).toEqual(events);
  });

  it("removes orphaned START event for malformed version 26.0.3", () => {
    // START_SCORING at index 0 is NOT followed by STOP_SCORING → orphaned
    const events = [
      [10, 0, 2], // START_SCORING (orphaned)
      [15, 12, 2], // START_FEEDING
      [20, 13, 2], // STOP_FEEDING
    ];
    const result = removeOrphanedStartEvents(events, "26.0.3");
    // The orphaned START_SCORING at index 0 should be removed
    expect(result).not.toContainEqual([10, 0, 2]);
    // START_FEEDING → STOP_FEEDING pair should remain intact
    expect(result).toContainEqual([15, 12, 2]);
    expect(result).toContainEqual([20, 13, 2]);
  });

  it("keeps START event when correctly paired with its STOP counterpart", () => {
    // START_SCORING followed immediately by STOP_SCORING → keep both
    const events = [
      [10, 0, 2], // START_SCORING
      [15, 1, 2], // STOP_SCORING
    ];
    const result = removeOrphanedStartEvents(events, "26.0.4");
    expect(result).toEqual(events);
  });

  it("keeps START_MATCH regardless of what follows (not a paired event)", () => {
    const events = [
      [0, 2, 8], // START_MATCH
      [10, 0, 2], // START_SCORING
      [15, 1, 2], // STOP_SCORING
    ];
    const result = removeOrphanedStartEvents(events, "26.0.3");
    expect(result).toContainEqual([0, 2, 8]); // START_MATCH always kept
    expect(result).toContainEqual([10, 0, 2]);
    expect(result).toContainEqual([15, 1, 2]);
  });

  it("removes orphaned START for malformed version 26.0.4", () => {
    const events = [
      [10, 12, 2], // START_FEEDING (orphaned — next is not STOP_FEEDING)
      [20, 0, 2], // START_SCORING
      [25, 1, 2], // STOP_SCORING
    ];
    const result = removeOrphanedStartEvents(events, "26.0.4");
    // START_FEEDING not followed by STOP_FEEDING → removed
    expect(result).not.toContainEqual([10, 12, 2]);
    expect(result).toContainEqual([20, 0, 2]);
    expect(result).toContainEqual([25, 1, 2]);
  });

  it("returns an empty array when given an empty array", () => {
    expect(removeOrphanedStartEvents([], "26.0.3")).toEqual([]);
  });
});

describe("checkForInvalidEvents", () => {
  it("returns null for a valid empty event list", () => {
    expect(checkForInvalidEvents([])).toBeNull();
  });

  it("returns null for a valid paired START/STOP sequence", () => {
    const events = [
      [0, 2, 8], // START_MATCH
      [10, 0, 2], // START_SCORING
      [15, 1, 2], // STOP_SCORING
    ];
    expect(checkForInvalidEvents(events)).toBeNull();
  });

  it("returns an error when a START event occurs while already in another event", () => {
    const events = [
      [10, 0, 2], // START_SCORING
      [12, 12, 2], // START_FEEDING (invalid — already scoring)
      [15, 13, 2], // STOP_FEEDING
      [20, 1, 2], // STOP_SCORING
    ];
    const result = checkForInvalidEvents(events);
    expect(result).not.toBeNull();
    expect(result!.length).toBeGreaterThan(0);
    expect(result![0]).toMatch(/Cannot start/i);
  });

  it("returns an error when STOP event occurs without a matching START", () => {
    const events = [
      [10, 1, 2], // STOP_SCORING without preceding START_SCORING
    ];
    const result = checkForInvalidEvents(events);
    expect(result).not.toBeNull();
    expect(result![0]).toMatch(/Cannot stop/i);
  });

  it("returns an error when STOP event type does not match the active START type", () => {
    const events = [
      [10, 0, 2], // START_SCORING
      [15, 13, 2], // STOP_FEEDING (mismatched — should be STOP_SCORING)
    ];
    const result = checkForInvalidEvents(events);
    expect(result).not.toBeNull();
    expect(result![0]).toMatch(/Cannot stop FEEDING.*while in SCORING/i);
  });

  it("returns an error when an event is left open at the end of the list", () => {
    const events = [
      [10, 0, 2], // START_SCORING (no matching STOP)
    ];
    const result = checkForInvalidEvents(events);
    expect(result).not.toBeNull();
    expect(result![0]).toMatch(/Missing stop event/i);
  });

  it("returns null for multiple valid START/STOP pairs in sequence", () => {
    const events = [
      [10, 0, 2], // START_SCORING
      [15, 1, 2], // STOP_SCORING
      [20, 12, 2], // START_FEEDING
      [25, 13, 2], // STOP_FEEDING
      [30, 5, 2], // START_DEFENDING
      [35, 6, 2], // STOP_DEFENDING
    ];
    expect(checkForInvalidEvents(events)).toBeNull();
  });

  it("ignores START_MATCH and continues validation normally", () => {
    const events = [
      [0, 2, 8], // START_MATCH
      [10, 0, 2], // START_SCORING
      [15, 1, 2], // STOP_SCORING
    ];
    expect(checkForInvalidEvents(events)).toBeNull();
  });

  it("allows non-paired actions (INTAKE, OUTTAKE, CLIMB, etc.) anywhere", () => {
    const events = [
      [5, 7, 7], // INTAKE
      [10, 0, 2], // START_SCORING
      [11, 8, 8], // OUTTAKE (non-paired, should be fine)
      [15, 1, 2], // STOP_SCORING
      [20, 11, 2], // CLIMB (non-paired)
    ];
    expect(checkForInvalidEvents(events)).toBeNull();
  });

  it("accumulates multiple errors and returns all of them", () => {
    const events = [
      [10, 1, 2], // STOP_SCORING without START
      [15, 13, 2], // STOP_FEEDING without START
    ];
    const result = checkForInvalidEvents(events);
    expect(result).not.toBeNull();
    expect(result!.length).toBeGreaterThanOrEqual(2);
  });
});
