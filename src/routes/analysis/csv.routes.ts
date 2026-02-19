import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth.js";
import { getReportCSV } from "../../handler/analysis/csv/getReportCSV.js";
import { getTeamCSV } from "../../handler/analysis/csv/getTeamCSV.js";
import { registry } from "../../lib/openapi.js";
import { z } from "zod";

const router = Router();

registry.registerPath({
  method: "get",
  path: "/v1/analysis/csvplain",
  tags: ["Analysis - CSV"],
  summary: "Team CSV",
  request: {
    query: z.object({
      team: z.coerce.number().int(),
      tournamentKey: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: "CSV",
      content: { "text/csv": { schema: z.string() } },
    },
    400: { description: "Invalid parameters or not enough scouting data" },
    500: { description: "Internal server error" },
  },
  security: [{ bearerAuth: [] }],
});
registry.registerPath({
  method: "get",
  path: "/v1/analysis/matchcsv",
  tags: ["Analysis - CSV"],
  summary: "Team match CSV",
  request: {
    query: z.object({
      team: z.coerce.number().int(),
      tournamentKey: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: "CSV",
      content: { "text/csv": { schema: z.string() } },
    },
    400: { description: "Invalid parameters or not enough scouting data" },
    500: { description: "Internal server error" },
  },
  security: [{ bearerAuth: [] }],
});
registry.registerPath({
  method: "get",
  path: "/v1/analysis/reportcsv",
  tags: ["Analysis - CSV"],
  summary: "Report CSV",
  request: { query: z.object({ tournamentKey: z.string() }) },
  responses: {
    200: {
      description: "CSV",
      content: { "text/csv": { schema: z.string() } },
    },
    400: { description: "Invalid parameters or not enough scouting data" },
    500: { description: "Internal server error" },
  },
  security: [{ bearerAuth: [] }],
});

router.use(requireAuth);

router.get("/csvplain", getTeamCSV);
router.get("/reportcsv", getReportCSV);

export default router;
