import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth.js";
import { updateScouterShift } from "../../handler/manager/scoutershifts/updateScouterShift.js";
import { deleteScouterShift } from "../../handler/manager/scoutershifts/deleteScouterShift.js";
import { registry } from "../../lib/openapi.js";
import { z } from "zod";

const router = Router();

registry.registerPath({
  method: "post",
  path: "/v1/manager/scoutershift/{uuid}",
  tags: ["Manager - Scouter Shifts"],
  summary: "Update scouter shift",
  request: { params: z.object({ uuid: z.string() }), body: { content: { "application/json": { schema: z.object({ scouterId: z.string(), matchNumber: z.number().int() }) } } } },
  responses: { 200: { description: "Updated" }, 400: { description: "Invalid request" }, 401: { description: "Unauthorized" }, 500: { description: "Server error" } },
  security: [{ bearerAuth: [] }],
});
registry.registerPath({
  method: "delete",
  path: "/v1/manager/scoutershift/{uuid}",
  tags: ["Manager - Scouter Shifts"],
  summary: "Delete scouter shift",
  request: { params: z.object({ uuid: z.string() }) },
  responses: { 200: { description: "Deleted" }, 401: { description: "Unauthorized" }, 404: { description: "Not found" }, 500: { description: "Server error" } },
  security: [{ bearerAuth: [] }],
});

router.use(requireAuth);

router.post("/:uuid", updateScouterShift);

router.delete("/:uuid", deleteScouterShift);

export default router;
