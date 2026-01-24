import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth.js";
import { addMutablePicklist } from "../../handler/manager/mutablepicklists/addMutablePicklist.js";
import { deleteMutablePicklist } from "../../handler/manager/mutablepicklists/deleteMutablePicklist.js";
import { getMutablePicklists } from "../../handler/manager/mutablepicklists/getMutablePicklists.js";
import { getSingleMutablePicklist } from "../../handler/manager/mutablepicklists/getSingleMutablePicklist.js";
import { updateMutablePicklist } from "../../handler/manager/mutablepicklists/updateMutablePicklist.js";
import { registry } from "../../lib/openapi.js";
import { z } from "zod";

/*

mutablepicklists.routes.ts

POST   /manager/mutablepicklists
GET    /manager/mutablepicklists
GET    /manager/mutablepicklists/:uuid
PUT    /manager/mutablepicklists/:uuid
DELETE /manager/mutablepicklists/:uuid

*/

const MutablePicklistCreateSchema = z.object({ name: z.string() });
const MutablePicklistSummarySchema = z.object({ uuid: z.string(), name: z.string() });
const MutablePicklistDetailSchema = z.object({ uuid: z.string(), name: z.string(), authorId: z.string() });

registry.registerPath({
  method: "post",
  path: "/v1/manager/mutablepicklists",
  tags: ["Manager - Mutable Picklists"],
  summary: "Create mutable picklist",
  request: { body: { content: { "application/json": { schema: MutablePicklistCreateSchema } } } },
  responses: { 200: { description: "Created" }, 400: { description: "Invalid request" }, 401: { description: "Unauthorized" } },
  security: [{ bearerAuth: [] }],
});
registry.registerPath({
  method: "get",
  path: "/v1/manager/mutablepicklists",
  tags: ["Manager - Mutable Picklists"],
  summary: "List mutable picklists",
  responses: { 200: { description: "List", content: { "application/json": { schema: z.array(MutablePicklistSummarySchema) } } }, 401: { description: "Unauthorized" } },
  security: [{ bearerAuth: [] }],
});
registry.registerPath({
  method: "get",
  path: "/v1/manager/mutablepicklists/{uuid}",
  tags: ["Manager - Mutable Picklists"],
  summary: "Get mutable picklist",
  request: { params: z.object({ uuid: z.string() }) },
  responses: { 200: { description: "Detail", content: { "application/json": { schema: MutablePicklistDetailSchema } } }, 404: { description: "Not found" } },
  security: [{ bearerAuth: [] }],
});
registry.registerPath({
  method: "put",
  path: "/v1/manager/mutablepicklists/{uuid}",
  tags: ["Manager - Mutable Picklists"],
  summary: "Update mutable picklist",
  request: { params: z.object({ uuid: z.string() }), body: { content: { "application/json": { schema: MutablePicklistCreateSchema.partial() } } } },
  responses: { 200: { description: "Updated" }, 400: { description: "Invalid request" } },
  security: [{ bearerAuth: [] }],
});
registry.registerPath({
  method: "delete",
  path: "/v1/manager/mutablepicklists/{uuid}",
  tags: ["Manager - Mutable Picklists"],
  summary: "Delete mutable picklist",
  request: { params: z.object({ uuid: z.string() }) },
  responses: { 200: { description: "Deleted" }, 404: { description: "Not found" } },
  security: [{ bearerAuth: [] }],
});

const router = Router();

router.use(requireAuth);

router.post("/", addMutablePicklist);
router.delete("/:uuid", deleteMutablePicklist);
router.get("/", getMutablePicklists);
router.get("/:uuid", getSingleMutablePicklist);
router.put("/:uuid", updateMutablePicklist);

export default router;
