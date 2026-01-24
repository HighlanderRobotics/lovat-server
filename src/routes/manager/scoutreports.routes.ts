import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth.js";
import { addScoutReport } from "../../handler/manager/scoutreports/addScoutReport.js";
import { deleteScoutReport } from "../../handler/manager/scoutreports/deleteScoutReport.js";
import { getScoutReport } from "../../handler/manager/scoutreports/getScoutReport.js";

import { registry } from "../../lib/openapi.js";
import { z } from "zod";

const ScoutReportCreateSchema = z.object({
  match: z.number().int(),
  team: z.number().int(),
  data: z.record(z.string(), z.any()).optional(),
});
const ScoutReportSchema = z.object({ uuid: z.string(), match: z.number().int(), team: z.number().int(), data: z.record(z.string(), z.any()).optional() });

registry.registerPath({
  method: "post",
  path: "/v1/manager/scoutreports",
  security: [{ bearerAuth: [] }],
  tags: ["Manager - Scout Reports"],
  summary: "Create scout report",
  request: { body: { content: { "application/json": { schema: ScoutReportCreateSchema } } } },
  responses: {
    200: { description: "Created", content: { "application/json": { schema: z.object({ uuid: z.string() }) } } },
    400: { description: "Invalid request" },
  },
});
registry.registerPath({
  method: "get",
  path: "/v1/manager/scoutreports/{uuid}",
  security: [{ bearerAuth: [] }],
  tags: ["Manager - Scout Reports"],
  summary: "Get scout report",
  request: { params: z.object({ uuid: z.string() }) },
  responses: {
    200: { description: "Scout report", content: { "application/json": { schema: ScoutReportSchema } } },
    404: { description: "Not found" },
  },
});
registry.registerPath({
  method: "delete",
  path: "/v1/manager/scoutreports/{uuid}",
  security: [{ bearerAuth: [] }],
  tags: ["Manager - Scout Reports"],
  summary: "Delete scout report",
  request: { params: z.object({ uuid: z.string() }) },
  responses: { 200: { description: "Deleted" }, 404: { description: "Not found" } },
});

const router = Router();

router.use(requireAuth);

router.post("/", addScoutReport);
router.get("/:uuid", getScoutReport);
router.delete("/:uuid", deleteScoutReport);

export default router;
