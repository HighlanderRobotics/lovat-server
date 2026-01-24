import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth.js";
import { matchPageSpecificScouter } from "../../handler/analysis/specificMatchPage/matchPageSpecificScouter.js";
import { scoutReportForMatch } from "../../handler/analysis/specificMatchPage/scoutReportForMatch.js";
import { timelineForScoutReport } from "../../handler/analysis/specificMatchPage/timelineForScoutReport.js";
import { registry } from "../../lib/openapi.js";
import { z } from "zod";

const router = Router();

registry.registerPath({
  method: "get",
  path: "/v1/analysis/metrics/scoutreport/{uuid}",
  security: [{ bearerAuth: [] }],
  tags: ["Analysis - Scout Report"],
  summary: "Metrics for specific scout report",
  request: { params: z.object({ uuid: z.string() }) },
  responses: { 200: { description: "Metrics", content: { "application/json": { schema: z.record(z.string(), z.any()) } } }, 404: { description: "Not found" } },
});
registry.registerPath({
  method: "get",
  path: "/v1/analysis/scoutreports/match/{match}",
  security: [{ bearerAuth: [] }],
  tags: ["Analysis - Scout Report"],
  summary: "All scout reports for a match",
  request: { params: z.object({ match: z.coerce.number().int() }) },
  responses: { 200: { description: "Reports", content: { "application/json": { schema: z.array(z.record(z.string(), z.any())) } } } },
});
registry.registerPath({
  method: "get",
  path: "/v1/analysis/timeline/scoutreport/{uuid}",
  security: [{ bearerAuth: [] }],
  tags: ["Analysis - Scout Report"],
  summary: "Timeline data for scout report",
  request: { params: z.object({ uuid: z.string() }) },
  responses: { 200: { description: "Timeline", content: { "application/json": { schema: z.record(z.string(), z.any()) } } } },
});

router.use(requireAuth);

router.get("/metrics/scoutreport/:uuid", matchPageSpecificScouter);
router.get("/scoutreports/match/:match", scoutReportForMatch);
router.get("/timeline/scoutreport/:uuid", timelineForScoutReport);

export default router;
