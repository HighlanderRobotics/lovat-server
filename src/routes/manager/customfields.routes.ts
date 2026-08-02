import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth.js";
import { requireVerifiedTeam } from "../../lib/middleware/requireVerifiedTeam.js";
import { getCustomFieldsManifest } from "../../handler/manager/customfields/getCustomFieldsManifest.js";
import { getCustomFields } from "../../handler/manager/customfields/getCustomFields.js";
import { addCustomField } from "../../handler/manager/customfields/addCustomField.js";
import { updateCustomField } from "../../handler/manager/customfields/updateCustomField.js";
import { reorderCustomFields } from "../../handler/manager/customfields/reorderCustomFields.js";
import { archiveCustomField } from "../../handler/manager/customfields/archiveCustomField.js";
import { unarchiveCustomField } from "../../handler/manager/customfields/unarchiveCustomField.js";
import { deleteCustomField } from "../../handler/manager/customfields/deleteCustomField.js";

import { registry } from "../../lib/openapi.js";
import { z } from "zod";
import {
  CustomFieldSchema,
  CustomFieldTypeSchema,
} from "../../lib/prisma-zod.js";

const CustomFieldManifestSchema = z.object({
  hash: z.string(),
  data: z.array(
    z.object({
      uuid: z.string(),
      name: z.string(),
      type: CustomFieldTypeSchema,
      options: z.array(z.string()),
    }),
  ),
});

const CustomFieldCreateSchema = z.object({
  name: z.string().min(1).max(100),
  type: CustomFieldTypeSchema,
  options: z.array(z.string().min(1).max(80)).max(30).optional(),
});

const CustomFieldUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  options: z.array(z.string().min(1).max(80)).max(30).optional(),
});

const CustomFieldReorderSchema = z.object({
  fieldUuids: z.array(z.string()),
});

registry.registerPath({
  method: "get",
  path: "/v1/manager/customfields/manifest",
  tags: ["Manager - Custom Fields (Public)"],
  summary: "List active custom fields for team code (collection manifest)",
  request: { headers: z.object({ "x-team-code": z.string() }) },
  responses: {
    200: {
      description: "Hash and active custom fields in display order",
      content: {
        "application/json": { schema: CustomFieldManifestSchema },
      },
    },
    400: { description: "Invalid request" },
    404: { description: "Team code not found" },
    500: { description: "Server error" },
  },
});

registry.registerPath({
  method: "get",
  path: "/v1/manager/customfields",
  tags: ["Manager - Custom Fields"],
  summary: "List custom fields for current team (incl. archived)",
  request: { query: z.object({ archived: z.string().optional() }) },
  responses: {
    200: {
      description: "Custom fields in display order",
      content: {
        "application/json": { schema: z.array(CustomFieldSchema) },
      },
    },
    400: { description: "Invalid request" },
    401: { description: "Unauthorized" },
    403: { description: "User not affiliated with a team" },
    500: { description: "Server error" },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: "post",
  path: "/v1/manager/customfields",
  tags: ["Manager - Custom Fields"],
  summary: "Create custom field (SCOUTING_LEAD)",
  request: {
    body: {
      content: { "application/json": { schema: CustomFieldCreateSchema } },
    },
  },
  responses: {
    200: {
      description: "Created",
      content: { "application/json": { schema: CustomFieldSchema } },
    },
    400: { description: "Invalid request or active field cap reached" },
    401: { description: "Unauthorized" },
    403: { description: "Not a scouting lead" },
    500: { description: "Server error" },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: "put",
  path: "/v1/manager/customfields/order",
  tags: ["Manager - Custom Fields"],
  summary: "Reorder active custom fields (SCOUTING_LEAD)",
  request: {
    body: {
      content: { "application/json": { schema: CustomFieldReorderSchema } },
    },
  },
  responses: {
    200: {
      description: "Reordered",
      content: { "text/plain": { schema: z.string() } },
    },
    400: { description: "Field list is out of date" },
    401: { description: "Unauthorized" },
    403: { description: "Not a scouting lead" },
    500: { description: "Server error" },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: "put",
  path: "/v1/manager/customfields/{uuid}",
  tags: ["Manager - Custom Fields"],
  summary: "Update custom field (SCOUTING_LEAD; type immutable)",
  request: {
    params: z.object({ uuid: z.string() }),
    body: {
      content: { "application/json": { schema: CustomFieldUpdateSchema } },
    },
  },
  responses: {
    200: {
      description: "Updated",
      content: { "application/json": { schema: CustomFieldSchema } },
    },
    400: { description: "Invalid request or options removed/renamed" },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden" },
    404: { description: "Not found" },
    500: { description: "Server error" },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: "post",
  path: "/v1/manager/customfields/{uuid}/archive",
  tags: ["Manager - Custom Fields"],
  summary: "Archive custom field (SCOUTING_LEAD)",
  request: { params: z.object({ uuid: z.string() }) },
  responses: {
    200: {
      description: "Archived",
      content: { "text/plain": { schema: z.string() } },
    },
    400: { description: "Invalid request" },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden" },
    404: { description: "Not found" },
    500: { description: "Server error" },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: "post",
  path: "/v1/manager/customfields/{uuid}/unarchive",
  tags: ["Manager - Custom Fields"],
  summary: "Unarchive custom field (SCOUTING_LEAD)",
  request: { params: z.object({ uuid: z.string() }) },
  responses: {
    200: {
      description: "Unarchived",
      content: { "text/plain": { schema: z.string() } },
    },
    400: { description: "Active field cap reached" },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden" },
    404: { description: "Not found" },
    500: { description: "Server error" },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: "delete",
  path: "/v1/manager/customfields/{uuid}",
  tags: ["Manager - Custom Fields"],
  summary: "Delete custom field without answers (SCOUTING_LEAD)",
  request: { params: z.object({ uuid: z.string() }) },
  responses: {
    200: {
      description: "Deleted",
      content: { "text/plain": { schema: z.string() } },
    },
    400: { description: "Invalid request" },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden" },
    404: { description: "Not found" },
    409: { description: "Field has recorded answers" },
    500: { description: "Server error" },
  },
  security: [{ bearerAuth: [] }],
});

const router = Router();

// Public/unauthenticated endpoints (collection app, x-team-code header)
router.get("/manifest", getCustomFieldsManifest);

router.use(requireAuth, requireVerifiedTeam);

router.get("/", getCustomFields);
router.post("/", addCustomField);

// Must be registered before the /:uuid routes
router.put("/order", reorderCustomFields);

router.put("/:uuid", updateCustomField);
router.post("/:uuid/archive", archiveCustomField);
router.post("/:uuid/unarchive", unarchiveCustomField);
router.delete("/:uuid", deleteCustomField);

export default router;
