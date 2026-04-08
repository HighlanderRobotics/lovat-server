import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import bodyParser from "body-parser";

// ── Mock all external I/O ────────────────────────────────────────────────────

const { mockScoutReport, mockEventFindMany } = vi.hoisted(() => ({
  mockScoutReport: vi.fn(),
  mockEventFindMany: vi.fn(),
}));

vi.mock("../../../prismaClient.js", () => ({
  default: {
    scoutReport: { findUnique: mockScoutReport },
    event: { findMany: mockEventFindMany },
    team: { findMany: vi.fn().mockResolvedValue([]) },
    tournament: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

vi.mock("../../../redisClient.js", () => ({
  kv: { get: vi.fn(), set: vi.fn(), del: vi.fn(), flush: vi.fn() },
}));

// ── Import handler ───────────────────────────────────────────────────────────

import { getScoutReport } from "./getScoutReport.js";
import { UserRole } from "@prisma/client";

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Build a minimal Express app with an authenticated user injected. */
function buildApp(user: object) {
  const app = express();
  app.use(bodyParser.json());

  // Inject user directly onto req (bypassing real auth middleware)
  app.use((req: any, _res, next) => {
    req.user = user;
    next();
  });

  app.get("/scoutreports/:uuid", getScoutReport);
  return app;
}

const baseUser = {
  id: "user-1",
  email: "test@example.com",
  teamNumber: 9000,
  role: UserRole.SCOUTING_LEAD,
  username: null,
  teamSourceRule: { mode: "INCLUDE", items: [] },
  tournamentSourceRule: { mode: "INCLUDE", items: [] },
};

const mockReportRow = {
  uuid: "report-uuid-1",
  teamMatchKey: "match-key",
  endgameClimb: "L2",
  driverAbility: 3,
  autoClimb: "NOT_ATTEMPTED",
  defenseEffectiveness: 2,
  notes: "",
  scouter: { name: "Alice", sourceTeamNumber: 9000 },
};

const mockEvents = [
  {
    eventUuid: "ev-1",
    action: "START_SCORING",
    time: 5,
    position: "HUB",
    points: 0,
    scoutReportUuid: "report-uuid-1",
  },
];

// ── Tests ────────────────────────────────────────────────────────────────────

describe("getScoutReport handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 when the scout report does not exist", async () => {
    mockScoutReport.mockResolvedValueOnce(null);

    const app = buildApp(baseUser);
    const res = await request(app).get("/scoutreports/nonexistent-uuid");

    expect(res.status).toBe(404);
  });

  it("returns 200 with report + events on success", async () => {
    mockScoutReport.mockResolvedValueOnce(mockReportRow);
    mockEventFindMany.mockResolvedValueOnce(mockEvents);

    const app = buildApp(baseUser);
    const res = await request(app).get("/scoutreports/report-uuid-1");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("scoutReport");
    expect(res.body).toHaveProperty("events");
    expect(res.body.events).toHaveLength(1);
  });

  it("includes scouterName when the report belongs to the requesting team", async () => {
    mockScoutReport.mockResolvedValueOnce(mockReportRow);
    mockEventFindMany.mockResolvedValueOnce([]);

    const app = buildApp({ ...baseUser, teamNumber: 9000 });
    const res = await request(app).get("/scoutreports/report-uuid-1");

    expect(res.status).toBe(200);
    expect(res.body.scoutReport.scouterName).toBe("Alice");
  });

  it("omits scouterName when the report belongs to a different team", async () => {
    mockScoutReport.mockResolvedValueOnce(mockReportRow); // scouter.sourceTeamNumber = 9000
    mockEventFindMany.mockResolvedValueOnce([]);

    const app = buildApp({ ...baseUser, teamNumber: 1234 }); // different team
    const res = await request(app).get("/scoutreports/report-uuid-1");

    expect(res.status).toBe(200);
    expect(res.body.scoutReport.scouterName).toBeUndefined();
  });

  it("sets canModify=true for SCOUTING_LEAD on their own team's report", async () => {
    mockScoutReport.mockResolvedValueOnce(mockReportRow);
    mockEventFindMany.mockResolvedValueOnce([]);

    const app = buildApp({ ...baseUser, role: UserRole.SCOUTING_LEAD, teamNumber: 9000 });
    const res = await request(app).get("/scoutreports/report-uuid-1");

    expect(res.status).toBe(200);
    expect(res.body.canModify).toBe(true);
  });

  it("sets canModify=false for non-SCOUTING_LEAD users", async () => {
    mockScoutReport.mockResolvedValueOnce(mockReportRow);
    mockEventFindMany.mockResolvedValueOnce([]);

    const app = buildApp({ ...baseUser, role: UserRole.ANALYST, teamNumber: 9000 });
    const res = await request(app).get("/scoutreports/report-uuid-1");

    expect(res.status).toBe(200);
    expect(res.body.canModify).toBe(false);
  });

  it("sets canModify=false when report belongs to a different team", async () => {
    mockScoutReport.mockResolvedValueOnce(mockReportRow); // sourceTeamNumber = 9000
    mockEventFindMany.mockResolvedValueOnce([]);

    const app = buildApp({ ...baseUser, role: UserRole.SCOUTING_LEAD, teamNumber: 1234 });
    const res = await request(app).get("/scoutreports/report-uuid-1");

    expect(res.status).toBe(200);
    expect(res.body.canModify).toBe(false);
  });

  it("returns 500 when the database throws", async () => {
    mockScoutReport.mockRejectedValueOnce(new Error("DB error"));

    const app = buildApp(baseUser);
    const res = await request(app).get("/scoutreports/some-uuid");

    expect(res.status).toBe(500);
  });
});
