import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth.js";
import { addScoutReport } from "../../handler/manager/scoutreports/addScoutReport.js";
import { deleteScoutReport } from "../../handler/manager/scoutreports/deleteScoutReport.js";
import { getScoutReport } from "../../handler/manager/scoutreports/getScoutReport.js";

import { registry } from "../../lib/openapi.js";
import { z } from "zod";

import { EventSchema, ScoutReportSchema as PrismaScoutReportSchema } from "../../lib/prisma-zod.js";

const ScoutReportCreateSchema = z.object({
  uuid: z.string(),
  tournamentKey: z.string(),
  matchType: z.enum(["QUALIFICATION", "ELIMINATION"]),
  matchNumber: z.number().int(),
  startTime: z.number().int(),
  notes: z.string(),
  robotRoles: z.array(z.enum(["CYCLING", "SCORING", "FEEDING", "DEFENDING", "IMMOBILE"])),
  mobility: z.enum(["TRENCH", "BUMP", "BOTH", "NONE"]),
  climbPosition: z.enum(["SIDE", "MIDDLE"]).optional(),
  climbSide: z.enum(["FRONT", "BACK"]).optional(),
  beached: z.enum(["ON_FUEL", "ON_BUMP", "BOTH", "NEITHER"]),
  feederTypes: z.array(z.enum(["CONTINUOUS", "STOP_TO_SHOOT", "DUMP"])),
  intakeType: z.enum(["GROUND", "OUTPOST", "BOTH", "NEITHER"]),
  robotBrokeDescription: z.string().nullable().optional(),
  driverAbility: z.number().int(),
  accuracy: z.number().int(),
  disrupts: z.boolean(),
  defenseEffectiveness: z.number().int(),
  scoresWhileMoving: z.boolean(),
  autoClimb: z.enum(["NOT_ATTEMPTED", "FAILED", "SUCCEEDED"]),
  endgameClimb: z.enum(["NOT_ATTEMPTED", "FAILED", "L1", "L2", "L3"]),
  scouterUuid: z.string(),
  teamNumber: z.number().int(),
  events: z.array(
    z.tuple([
      z.number().int(), // time
      z.number().int(), // action index
      z.number().int(), // position index
      z.number().int().optional(), // points/quantity (optional)
    ]),
  ),
});

registry.registerPath({
  method: "post",
  path: "/v1/manager/scoutreports",
  security: [{ bearerAuth: [] }],
  tags: ["Manager - Scout Reports"],
  summary: "Create scout report",
  request: { body: { content: { "application/json": { schema: ScoutReportCreateSchema } } } },
  responses: {
    200: { description: "Created", content: { "text/plain": { schema: z.string() } } },
    400: { description: "Invalid request" },
    401: { description: "Unauthorized" },
    404: { description: "Match not found" },
    500: { description: "Server error" },
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
    200: {
      description: "Scout report and events",
      content: {
        "application/json": {
          schema: z.object({ scoutReport: PrismaScoutReportSchema, events: z.array(EventSchema) }),
        },
      },
    },
    400: { description: "Invalid request" },
    404: { description: "Not found" },
    500: { description: "Server error" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/v1/manager/scoutreports/{uuid}",
  security: [{ bearerAuth: [] }],
  tags: ["Manager - Scout Reports"],
  summary: "Delete scout report",
  request: { params: z.object({ uuid: z.string() }) },
  responses: {
    200: { description: "Deleted", content: { "text/plain": { schema: z.string() } } },
    400: { description: "Invalid request" },
    404: { description: "Not found" },
    500: { description: "Server error" },
  },
});

const router = Router();

router.use(requireAuth);

router.post("/", addScoutReport);
router.get("/:uuid", getScoutReport);
router.delete("/:uuid", deleteScoutReport);

export default router;
