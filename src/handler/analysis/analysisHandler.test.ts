import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import bodyParser from "body-parser";
import z from "zod";

// ── Mock external I/O ────────────────────────────────────────────────────────

const { mockKvGet, mockKvSet, mockCachedCreate } = vi.hoisted(() => ({
  mockKvGet: vi.fn(),
  mockKvSet: vi.fn(),
  mockCachedCreate: vi.fn(),
}));

vi.mock("../../prismaClient.js", () => ({
  default: {
    cachedAnalysis: { create: mockCachedCreate },
    team: { findMany: vi.fn().mockResolvedValue([]) },
    tournament: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

vi.mock("../../redisClient.js", () => ({
  kv: {
    get: mockKvGet,
    set: mockKvSet,
    del: vi.fn(),
    flush: vi.fn(),
  },
}));

// ── Import handler factory ───────────────────────────────────────────────────

import { createAnalysisHandler } from "./analysisHandler.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

const defaultUser = {
  id: "user-1",
  teamNumber: 9000,
  role: "ANALYST",
  email: "test@example.com",
  teamSourceRule: { mode: "INCLUDE", items: [] },
  tournamentSourceRule: { mode: "INCLUDE", items: [] },
};

function buildApp(handler: express.RequestHandler, user = defaultUser) {
  const app = express();
  app.use(bodyParser.json());
  app.use((req: any, _res, next) => {
    req.user = user;
    next();
  });
  app.get("/test", handler);
  return app;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("createAnalysisHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with analysis result when not cached (shouldCache=false)", async () => {
    const handler = createAnalysisHandler({
      params: {
        query: z.object({ value: z.string() }),
      },
      usesDataSource: false,
      shouldCache: false,
      createKey: () => ({ key: ["test"], teamDependencies: [] }),
      calculateAnalysis: async () => ({ answer: 42 }),
    });

    const app = buildApp(handler);
    const res = await request(app).get("/test?value=hello");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ answer: 42 });
  });

  it("returns 400 when query params fail zod validation", async () => {
    const handler = createAnalysisHandler({
      params: {
        query: z.object({ number: z.coerce.number() }),
      },
      usesDataSource: false,
      shouldCache: false,
      createKey: () => ({ key: ["test"] }),
      calculateAnalysis: async () => ({}),
    });

    const app = buildApp(handler);
    // 'number' param is missing → ZodError
    const res = await request(app).get("/test");

    expect(res.status).toBe(400);
  });

  it("returns 200 with cache miss header on first call (shouldCache=true)", async () => {
    mockKvGet.mockResolvedValueOnce(null); // cache miss
    mockKvSet.mockResolvedValueOnce("OK");
    mockCachedCreate.mockResolvedValueOnce({});

    const handler = createAnalysisHandler({
      params: {
        query: z.object({}),
      },
      usesDataSource: false,
      shouldCache: true,
      createKey: () => ({ key: ["mytest"], teamDependencies: [] }),
      calculateAnalysis: async () => ({ result: "fresh" }),
    });

    const app = buildApp(handler);
    const res = await request(app).get("/test");

    expect(res.status).toBe(200);
    expect(res.headers["x-lovat-cache"]).toBe("miss");
    expect(res.body).toEqual({ result: "fresh" });
  });

  it("returns 200 with cache hit header on subsequent call (shouldCache=true)", async () => {
    const cached = JSON.stringify({ result: "cached-value" });
    mockKvGet.mockResolvedValueOnce(cached); // cache hit

    const handler = createAnalysisHandler({
      params: {
        query: z.object({}),
      },
      usesDataSource: false,
      shouldCache: true,
      createKey: () => ({ key: ["mytest"], teamDependencies: [] }),
      calculateAnalysis: async () => {
        throw new Error("should not be called");
      },
    });

    const app = buildApp(handler);
    const res = await request(app).get("/test");

    expect(res.status).toBe(200);
    expect(res.headers["x-lovat-cache"]).toBe("hit");
    expect(res.body).toEqual({ result: "cached-value" });
  });

  it("returns 500 when calculateAnalysis throws", async () => {
    mockKvGet.mockResolvedValueOnce(null);

    const handler = createAnalysisHandler({
      params: {
        query: z.object({}),
      },
      usesDataSource: false,
      shouldCache: true,
      createKey: () => ({ key: ["fail-test"], teamDependencies: [] }),
      calculateAnalysis: async () => {
        throw new Error("calculation failed");
      },
    });

    const app = buildApp(handler);
    const res = await request(app).get("/test");

    expect(res.status).toBe(500);
  });

  it("returns 500 when shouldCache=false and calculateAnalysis throws", async () => {
    const handler = createAnalysisHandler({
      params: {
        query: z.object({}),
      },
      usesDataSource: false,
      shouldCache: false,
      createKey: () => ({ key: ["err-test"] }),
      calculateAnalysis: async () => {
        throw new Error("oops");
      },
    });

    const app = buildApp(handler);
    const res = await request(app).get("/test");

    expect(res.status).toBe(500);
  });

  it("appends data-source key fragments when usesDataSource=true", async () => {
    const capturedKeys: string[] = [];
    mockKvGet.mockImplementation(async (key: string) => {
      capturedKeys.push(key);
      return null; // always miss
    });
    mockKvSet.mockResolvedValue("OK");
    mockCachedCreate.mockResolvedValue({});

    const user = {
      ...defaultUser,
      teamSourceRule: { mode: "EXCLUDE", items: [1, 2] },
      tournamentSourceRule: { mode: "INCLUDE", items: ["2024arc"] },
    };

    const handler = createAnalysisHandler({
      params: { query: z.object({}) },
      usesDataSource: true,
      shouldCache: true,
      createKey: () => ({ key: ["ds-test"], teamDependencies: [] }),
      calculateAnalysis: async () => ({ ok: true }),
    });

    const app = buildApp(handler, user);
    await request(app).get("/test");

    expect(capturedKeys.length).toBeGreaterThan(0);
    // Key should contain data-source fragments
    expect(capturedKeys[0]).toContain("EXCLUDE");
    expect(capturedKeys[0]).toContain("INCLUDE");
  });
});
