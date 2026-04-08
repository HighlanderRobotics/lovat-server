import { describe, it, expect, vi } from "vitest";

// Mock prismaClient before importing analysisConstants to prevent DB connections
vi.mock("../../prismaClient.js", () => ({
  default: {
    team: { findMany: vi.fn().mockResolvedValue([]) },
    tournament: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

import { accuracyToPercentageInterpolated } from "./analysisConstants.js";

describe("accuracyToPercentageInterpolated", () => {
  it("returns 25 for accuracy 0", () => {
    expect(accuracyToPercentageInterpolated(0)).toBe(25);
  });

  it("returns 55 for accuracy 1", () => {
    expect(accuracyToPercentageInterpolated(1)).toBe(55);
  });

  it("returns 65 for accuracy 2", () => {
    expect(accuracyToPercentageInterpolated(2)).toBe(65);
  });

  it("returns 75 for accuracy 3", () => {
    expect(accuracyToPercentageInterpolated(3)).toBe(75);
  });

  it("returns 85 for accuracy 4", () => {
    expect(accuracyToPercentageInterpolated(4)).toBe(85);
  });

  it("returns 95 for accuracy 5", () => {
    expect(accuracyToPercentageInterpolated(5)).toBe(95);
  });

  it("interpolates between 0 and 1 at 0.5", () => {
    // 25 + 0.5 * (55 - 25) = 25 + 15 = 40
    expect(accuracyToPercentageInterpolated(0.5)).toBe(40);
  });

  it("interpolates between 1 and 2 at 1.5", () => {
    // 55 + 0.5 * (65 - 55) = 55 + 5 = 60
    expect(accuracyToPercentageInterpolated(1.5)).toBe(60);
  });

  it("interpolates between 4 and 5 at 4.5", () => {
    // 85 + 0.5 * (95 - 85) = 85 + 5 = 90
    expect(accuracyToPercentageInterpolated(4.5)).toBe(90);
  });

  it("clamps values below 0 to 0", () => {
    expect(accuracyToPercentageInterpolated(-1)).toBe(25);
  });

  it("clamps values above 5 to 5", () => {
    expect(accuracyToPercentageInterpolated(6)).toBe(95);
  });

  it("returns 25 for null (coerced to 0 by Math.max)", () => {
    expect(accuracyToPercentageInterpolated(null as any)).toBe(25);
  });

  it("returns NaN for undefined (NaN propagates through math ops)", () => {
    expect(accuracyToPercentageInterpolated(undefined as any)).toBeNaN();
  });

  it("interpolates between 2 and 3 at 2.25", () => {
    // 65 + 0.25 * (75 - 65) = 65 + 2.5 = 67.5
    expect(accuracyToPercentageInterpolated(2.25)).toBe(67.5);
  });
});
