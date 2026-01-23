import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth.js";
import { addPicklist } from "../../handler/manager/picklists/addPicklist.js";
import { deletePicklist } from "../../handler/manager/picklists/deletePicklist.js";
import { getPicklists } from "../../handler/manager/picklists/getPicklists.js";
import { getSinglePicklist } from "../../handler/manager/picklists/getSinglePicklist.js";
import { updatePicklist } from "../../handler/manager/picklists/updatePicklist.js";
import { registry } from "../../lib/openapi.js";
import { z } from "zod";

/*

picklists.routes.ts

POST   /manager/picklists
GET    /manager/picklists
GET    /manager/picklists/:uuid
PUT    /manager/picklists/:uuid
DELETE /manager/picklists/:uuid

*/

// Schemas for requests/responses
const PicklistCreateBodySchema = z.object({
  name: z.string(),
  totalPoints: z.number().default(0).optional(),
  autoPoints: z.number().default(0).optional(),
  teleopPoints: z.number().default(0).optional(),
  climbResult: z.number().default(0).optional(),
  autoClimb: z.number().default(0).optional(),
  defenseEffectiveness: z.number().default(0).optional(),
  contactDefenseTime: z.number().default(0).optional(),
  campingDefenseTime: z.number().default(0).optional(),
  totalDefensiveTime: z.number().default(0).optional(),
  totalFuelThroughput: z.number().default(0).optional(),
  totalFuelFed: z.number().default(0).optional(),
  feedingRate: z.number().default(0).optional(),
  scoringRate: z.number().default(0).optional(),
  estimatedSuccessfulFuelRate: z.number().default(0).optional(),
  estimatedTotalFuelScored: z.number().default(0).optional(),
  driverAbility: z.number().default(0).optional(),
});

const PicklistSummarySchema = z.object({
  name: z.string(),
  uuid: z.string(),
  author: z.object({ username: z.string().nullable().optional() }),
});

const PicklistDetailSchema = z.object({
  uuid: z.string(),
  name: z.string(),
  authorId: z.string(),
  totalPoints: z.number(),
  autoPoints: z.number(),
  teleopPoints: z.number(),
  climbResult: z.number(),
  autoClimb: z.number(),
  defenseEffectiveness: z.number(),
  contactDefenseTime: z.number(),
  campingDefenseTime: z.number(),
  totalDefensiveTime: z.number(),
  totalFuelThroughput: z.number(),
  totalFuelFed: z.number(),
  feedingRate: z.number(),
  scoringRate: z.number(),
  estimatedSuccessfulFuelRate: z.number(),
  estimatedTotalFuelScored: z.number(),
});

const PicklistUpdateBodySchema = PicklistCreateBodySchema;

// OpenAPI: Register paths for these routes
registry.registerPath({
  method: "post",
  path: "/v1/manager/picklists",
  tags: ["Manager - Picklists"],
  summary: "Create shared picklist",
  request: {
    body: {
      content: {
        "application/json": { schema: PicklistCreateBodySchema },
      },
      required: true,
    },
  },
  responses: {
    200: { description: "Picklist created", content: { "text/plain": { schema: z.string() } } },
    400: { description: "Invalid body" },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden" },
  },
});

registry.registerPath({
  method: "get",
  path: "/v1/manager/picklists",
  tags: ["Manager - Picklists"],
  summary: "List picklists by team",
  responses: {
    200: {
      description: "List of picklists",
      content: { "application/json": { schema: z.array(PicklistSummarySchema) } },
    },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden" },
  },
});

registry.registerPath({
  method: "get",
  path: "/v1/manager/picklists/{uuid}",
  tags: ["Manager - Picklists"],
  summary: "Get picklist by UUID",
  request: {
    params: z.object({ uuid: z.string() }),
  },
  responses: {
    200: { description: "Picklist detail", content: { "application/json": { schema: PicklistDetailSchema } } },
    400: { description: "Invalid UUID" },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden" },
    404: { description: "Not found" },
  },
});

registry.registerPath({
  method: "put",
  path: "/v1/manager/picklists/{uuid}",
  tags: ["Manager - Picklists"],
  summary: "Update picklist",
  request: {
    params: z.object({ uuid: z.string() }),
    body: { content: { "application/json": { schema: PicklistUpdateBodySchema } } },
  },
  responses: {
    200: { description: "Picklist updated", content: { "text/plain": { schema: z.string() } } },
    400: { description: "Invalid input" },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/v1/manager/picklists/{uuid}",
  tags: ["Manager - Picklists"],
  summary: "Delete picklist",
  request: { params: z.object({ uuid: z.string() }) },
  responses: {
    200: { description: "Deleted", content: { "text/plain": { schema: z.string() } } },
    400: { description: "Invalid UUID" },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden" },
    404: { description: "Not found" },
  },
});

const router = Router();

router.use(requireAuth);

router.post("/", addPicklist);

router.get("/", getPicklists);

router.get("/:uuid", getSinglePicklist);

router.put("/:uuid", updatePicklist);

router.delete("/:uuid", deletePicklist);

export default router;
