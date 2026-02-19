import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth.js";
import { updateScouterShift } from "../../handler/manager/scoutershifts/updateScouterShift.js";
import { deleteScouterShift } from "../../handler/manager/scoutershifts/deleteScouterShift.js";
import { registry } from "../../lib/openapi.js";
import { z } from "zod";

const router = Router();

const ScouterShiftUpdateSchema = z.object({
  startMatchOrdinalNumber: z.number().int(),
  endMatchOrdinalNumber: z.number().int(),
  team1: z.array(z.string()),
  team2: z.array(z.string()),
  team3: z.array(z.string()),
  team4: z.array(z.string()),
  team5: z.array(z.string()),
  team6: z.array(z.string()),
});

registry.registerPath({
  method: "post",
  path: "/v1/manager/scoutershifts/{uuid}",
  tags: ["Manager - Scouter Shifts"],
  summary: "Update scouter shift",
  request: { params: z.object({ uuid: z.string() }), body: { content: { "application/json": { schema: ScouterShiftUpdateSchema } } } },
  responses: { 200: { description: "Updated" }, 400: { description: "Invalid request" }, 401: { description: "Unauthorized" }, 403: { description: "Cannot be performed using an API key, or not a scouting lead" }, 404: { description: "Shift not found" }, 500: { description: "Server error" } },
  security: [{ bearerAuth: [] }],
});
registry.registerPath({
  method: "delete",
  path: "/v1/manager/scoutershifts/{uuid}",
  tags: ["Manager - Scouter Shifts"],
  summary: "Delete scouter shift",
  request: { params: z.object({ uuid: z.string() }) },
  responses: { 200: { description: "Deleted" }, 401: { description: "Unauthorized" }, 403: { description: "Forbidden" }, 404: { description: "Not found" }, 500: { description: "Server error" } },
  security: [{ bearerAuth: [] }],
});

router.use(requireAuth);

router.post("/:uuid", updateScouterShift);

router.delete("/:uuid", deleteScouterShift);

export default router;
