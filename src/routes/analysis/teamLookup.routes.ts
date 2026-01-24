import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth.js";
import { breakdownDetails } from "../../handler/analysis/teamLookUp/breakdownDetails.js";
import { breakdownMetrics } from "../../handler/analysis/teamLookUp/breakdownMetrics.js";
import { categoryMetrics } from "../../handler/analysis/teamLookUp/categoryMetrics.js";
import { detailsPage } from "../../handler/analysis/teamLookUp/detailsPage.js";
import { getNotes } from "../../handler/analysis/teamLookUp/getNotes.js";
import { multipleFlags } from "../../handler/analysis/teamLookUp/multipleFlags.js";
import { registry } from "../../lib/openapi.js";
import { z } from "zod";

const router = Router();

const TeamParam = z.object({ team: z.string() });
const MetricTeamParam = z.object({ metric: z.string(), team: z.string() });
const BreakdownParam = z.object({ team: z.string(), breakdown: z.string() });

registry.registerPath({
  method: "get",
  path: "/v1/analysis/metric/{metric}/team/{team}",
  security: [{ bearerAuth: [] }],
  tags: ["Analysis - Team Lookup"],
  summary: "Metric details for team",
  request: { params: MetricTeamParam },
  responses: { 200: { description: "Details", content: { "application/json": { schema: z.record(z.string(), z.any()) } } } },
});
registry.registerPath({
  method: "get",
  path: "/v1/analysis/category/team/{team}",
  security: [{ bearerAuth: [] }],
  tags: ["Analysis - Team Lookup"],
  summary: "Category metrics for team",
  request: { params: TeamParam },
  responses: { 200: { description: "Categories", content: { "application/json": { schema: z.record(z.string(), z.any()) } } } },
});
registry.registerPath({
  method: "get",
  path: "/v1/analysis/breakdown/team/{team}",
  security: [{ bearerAuth: [] }],
  tags: ["Analysis - Team Lookup"],
  summary: "Breakdown metrics for team",
  request: { params: TeamParam },
  responses: { 200: { description: "Breakdown", content: { "application/json": { schema: z.record(z.string(), z.any()) } } } },
});
registry.registerPath({
  method: "get",
  path: "/v1/analysis/breakdown/team/{team}/{breakdown}",
  security: [{ bearerAuth: [] }],
  tags: ["Analysis - Team Lookup"],
  summary: "Specific breakdown details",
  request: { params: BreakdownParam },
  responses: { 200: { description: "Details", content: { "application/json": { schema: z.record(z.string(), z.any()) } } } },
});
registry.registerPath({
  method: "get",
  path: "/v1/analysis/notes/team/{team}",
  security: [{ bearerAuth: [] }],
  tags: ["Analysis - Team Lookup"],
  summary: "Notes for team",
  request: { params: TeamParam },
  responses: { 200: { description: "Notes", content: { "application/json": { schema: z.array(z.object({ note: z.string() })) } } } },
});
registry.registerPath({
  method: "get",
  path: "/v1/analysis/flag/team/{team}",
  security: [{ bearerAuth: [] }],
  tags: ["Analysis - Team Lookup"],
  summary: "Flags for team",
  request: { params: TeamParam },
  responses: { 200: { description: "Flags", content: { "application/json": { schema: z.array(z.object({ flag: z.string() })) } } } },
});

router.use(requireAuth);

router.get("/metric/:metric/team/:team", detailsPage);
router.get("/category/team/:team", categoryMetrics);
router.get("/breakdown/team/:team", breakdownMetrics);
router.get("/breakdown/team/:team/:breakdown", breakdownDetails);
router.get("/notes/team/:team", getNotes);
router.get("/flag/team/:team", multipleFlags);

export default router;
