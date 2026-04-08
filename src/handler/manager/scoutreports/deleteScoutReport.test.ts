import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import bodyParser from "body-parser";

// ── Mock all external I/O ────────────────────────────────────────────────────

const { mockFindUnique, mockEventDeleteMany, mockScoutReportDelete } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockEventDeleteMany: vi.fn(),
  mockScoutReportDelete: vi.fn(),
}));

vi.mock("../../../prismaClient.js", () => ({
  default: {
    scoutReport: {
      findUnique: mockFindUnique,
      delete: mockScoutReportDelete,
    },
    event: { deleteMany: mockEventDeleteMany },
    team: { findMany: vi.fn().mockResolvedValue([]) },
    tournament: { findMany: vi.fn().mockResolvedValue([]) },
    cachedAnalysis: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

vi.mock("../../../redisClient.js", () => ({
  kv: { get: vi.fn(), set: vi.fn(), del: vi.fn(), flush: vi.fn() },
}));

vi.mock("../../../lib/clearCache.js", () => ({
  invalidateCache: vi.fn().mockResolvedValue(undefined),
}));

// ── Import handler ───────────────────────────────────────────────────────────

import { deleteScoutReport } from "./deleteScoutReport.js";
import { UserRole } from "@prisma/client";

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildApp(user: object, tokenType: "jwt" | "apiKey" = "jwt") {
  const app = express();
  app.use(bodyParser.json());

  app.use((req: any, _res, next) => {
    req.user = user;
    req.tokenType = tokenType;
    next();
  });

  app.delete("/scoutreports/:uuid", deleteScoutReport);
  return app;
}

const scoutingLeadUser = {
  id: "user-lead",
  teamNumber: 9000,
  role: UserRole.SCOUTING_LEAD,
  email: "lead@team.com",
  teamSourceRule: { mode: "INCLUDE", items: [] },
  tournamentSourceRule: { mode: "INCLUDE", items: [] },
};

const analystUser = {
  ...scoutingLeadUser,
  id: "user-analyst",
  role: UserRole.ANALYST,
};

const mockReportWithTeamMatch = {
  uuid: "report-uuid-1",
  scouter: { sourceTeamNumber: 9000 },
  teamMatchData: { teamNumber: 9000, tournamentKey: "2024test" },
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe("deleteScoutReport handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 403 when the request was authenticated with an API key", async () => {
    const app = buildApp(scoutingLeadUser, "apiKey");
    const res = await request(app).delete("/scoutreports/report-uuid-1");

    expect(res.status).toBe(403);
    // DB should NOT be queried at all
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it("returns 404 when the scout report is not found", async () => {
    mockFindUnique.mockResolvedValueOnce(null);

    const app = buildApp(scoutingLeadUser);
    const res = await request(app).delete("/scoutreports/nonexistent-uuid");

    expect(res.status).toBe(404);
  });

  it("returns 403 when the user is not SCOUTING_LEAD", async () => {
    mockFindUnique.mockResolvedValueOnce(mockReportWithTeamMatch);

    const app = buildApp(analystUser);
    const res = await request(app).delete("/scoutreports/report-uuid-1");

    expect(res.status).toBe(403);
    expect(mockScoutReportDelete).not.toHaveBeenCalled();
  });

  it("returns 403 when the scout report belongs to a different team", async () => {
    // The report's scouter is from team 1234, but the requesting user is from team 9000
    mockFindUnique.mockResolvedValueOnce({
      ...mockReportWithTeamMatch,
      scouter: { sourceTeamNumber: 1234 },
    });

    const app = buildApp(scoutingLeadUser); // user teamNumber = 9000
    const res = await request(app).delete("/scoutreports/report-uuid-1");

    expect(res.status).toBe(403);
    expect(mockScoutReportDelete).not.toHaveBeenCalled();
  });

  it("deletes the report and events and returns 200 for an authorized SCOUTING_LEAD", async () => {
    mockFindUnique.mockResolvedValueOnce(mockReportWithTeamMatch);
    mockEventDeleteMany.mockResolvedValueOnce({ count: 2 });
    mockScoutReportDelete.mockResolvedValueOnce(mockReportWithTeamMatch);

    const app = buildApp(scoutingLeadUser);
    const res = await request(app).delete("/scoutreports/report-uuid-1");

    expect(res.status).toBe(200);
    expect(mockEventDeleteMany).toHaveBeenCalledWith({
      where: { scoutReportUuid: "report-uuid-1" },
    });
    expect(mockScoutReportDelete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { uuid: "report-uuid-1" } }),
    );
  });

  it("returns 500 when the database throws an unexpected error", async () => {
    mockFindUnique.mockRejectedValueOnce(new Error("DB down"));

    const app = buildApp(scoutingLeadUser);
    const res = await request(app).delete("/scoutreports/report-uuid-1");

    expect(res.status).toBe(500);
  });
});
