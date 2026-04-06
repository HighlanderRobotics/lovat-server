import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth.js";
import { requireVerifiedTeam } from "../../lib/middleware/requireVerifiedTeam.js";
import { registry } from "../../lib/openapi.js";
import { z } from "zod";
import { createForm } from "../../handler/manager/forms/createForm.js";
import { deleteForm } from "../../handler/manager/forms/deleteForm.js";
import { getForms } from "../../handler/manager/forms/getForms.js";
import { updateFormName } from "../../handler/manager/forms/updateFormName.js";
import { createFormPart } from "../../handler/manager/forms/parts/createFormPart.js";
import { deleteFormPart } from "../../handler/manager/forms/parts/deleteFormPart.js";
import { getFormPart } from "../../handler/manager/forms/parts/getFormParts.js";
import { updateFormPart } from "../../handler/manager/forms/parts/updateFormPart.js";
import { reorderFormParts } from "../../handler/manager/forms/parts/reorderFormParts.js";
import { deleteFormResponse } from "../../handler/manager/forms/responses/deleteResponse.js";
import { getFormResponse } from "../../handler/manager/forms/responses/getResponse.js";
import { getFormResponses } from "../../handler/manager/forms/responses/getResponses.js";
import { submitForm } from "../../handler/manager/forms/responses/submitForm.js";

// Forms
registry.registerPath({
  method: "post",
  path: "/v1/manager/forms",
  tags: ["Manager - Forms"],
  summary: "Create a new form",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            team: z.number(),
            name: z.string(),
            parts: z.array(
              z.object({
                name: z.string(),
                type: z.string(),
                caption: z.string(),
                options: z.record(z.string(), z.unknown()).optional(),
              }),
            ),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: "Created" },
    400: { description: "Invalid request parameters" },
    401: { description: "Unauthorized" },
    500: { description: "Server error" },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: "delete",
  path: "/v1/manager/forms/{formUuid}",
  tags: ["Manager - Forms"],
  summary: "Delete a form",
  request: { params: z.object({ formUuid: z.string() }) },
  responses: {
    200: { description: "Deleted" },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden" },
    404: { description: "Form not found" },
    500: { description: "Server error" },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: "get",
  path: "/v1/manager/forms",
  tags: ["Manager - Forms"],
  summary: "List forms for the authenticated team",
  responses: {
    200: { description: "Forms" },
    401: { description: "Unauthorized" },
    500: { description: "Server error" },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: "put",
  path: "/v1/manager/forms/{formUuid}",
  tags: ["Manager - Forms"],
  summary: "Update form name",
  request: {
    params: z.object({ formUuid: z.string() }),
    body: {
      content: {
        "application/json": { schema: z.object({ name: z.string() }) },
      },
    },
  },
  responses: {
    200: { description: "Updated" },
    400: { description: "Invalid request parameters" },
    401: { description: "Unauthorized" },
    404: { description: "Form not found" },
    500: { description: "Server error" },
  },
  security: [{ bearerAuth: [] }],
});

// Form parts
registry.registerPath({
  method: "post",
  path: "/v1/manager/forms/{formUuid}/parts",
  tags: ["Manager - Form Parts"],
  summary: "Add a part to a form",
  request: {
    params: z.object({ formUuid: z.string() }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            name: z.string(),
            type: z.string(),
            caption: z.string(),
            options: z.record(z.string(), z.unknown()),
            order: z.number(),
          }),
        },
      },
    },
  },
  responses: {
    201: { description: "Created" },
    400: { description: "Invalid request parameters" },
    401: { description: "Unauthorized" },
    500: { description: "Server error" },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: "delete",
  path: "/v1/manager/forms/{formUuid}/parts/{partUuid}",
  tags: ["Manager - Form Parts"],
  summary: "Delete a form part",
  request: {
    params: z.object({ formUuid: z.string(), partUuid: z.string() }),
  },
  responses: {
    200: { description: "Deleted" },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden" },
    404: { description: "Form part not found" },
    500: { description: "Server error" },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: "get",
  path: "/v1/manager/forms/{formUuid}/parts/{partUuid}",
  tags: ["Manager - Form Parts"],
  summary: "Get a form part with its responses",
  request: {
    params: z.object({ formUuid: z.string(), partUuid: z.string() }),
  },
  responses: {
    200: { description: "Form part" },
    401: { description: "Unauthorized" },
    404: { description: "Form part not found" },
    500: { description: "Server error" },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: "put",
  path: "/v1/manager/forms/{formUuid}/parts/{partUuid}",
  tags: ["Manager - Form Parts"],
  summary: "Update a form part",
  request: {
    params: z.object({ formUuid: z.string(), partUuid: z.string() }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            name: z.string(),
            type: z.string(),
            caption: z.string(),
            options: z.record(z.string(), z.unknown()),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: "Updated" },
    400: { description: "Invalid request parameters" },
    401: { description: "Unauthorized" },
    404: { description: "Form part not found" },
    500: { description: "Server error" },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: "put",
  path: "/v1/manager/forms/{formUuid}/parts/{partUuid}/reorder",
  tags: ["Manager - Form Parts"],
  summary: "Reorder a form part",
  request: {
    params: z.object({ formUuid: z.string(), partUuid: z.string() }),
    body: {
      content: {
        "application/json": { schema: z.object({ order: z.number() }) },
      },
    },
  },
  responses: {
    200: { description: "Reordered" },
    400: { description: "Invalid request parameters" },
    401: { description: "Unauthorized" },
    404: { description: "Form part not found" },
    500: { description: "Server error" },
  },
  security: [{ bearerAuth: [] }],
});

// Form responses
registry.registerPath({
  method: "post",
  path: "/v1/manager/forms/{formUuid}/responses",
  tags: ["Manager - Form Responses"],
  summary: "Submit a form response",
  request: {
    params: z.object({ formUuid: z.string() }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            team: z.number().optional(),
            scouterUuid: z.string(),
            matchKey: z.string().optional(),
            parts: z.array(
              z.object({
                formPartUuid: z.string(),
                response: z.union([
                  z.string(),
                  z.number(),
                  z.array(z.string()),
                ]),
              }),
            ),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: "Submitted" },
    400: { description: "Invalid request parameters" },
    500: { description: "Server error" },
  },
});

registry.registerPath({
  method: "get",
  path: "/v1/manager/forms/{formUuid}/responses",
  tags: ["Manager - Form Responses"],
  summary: "Get all responses for a form",
  request: { params: z.object({ formUuid: z.string() }) },
  responses: {
    200: { description: "Form responses" },
    401: { description: "Unauthorized" },
    404: { description: "Form not found" },
    500: { description: "Server error" },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: "get",
  path: "/v1/manager/forms/{formUuid}/responses/{responseUuid}",
  tags: ["Manager - Form Responses"],
  summary: "Get a single form response",
  request: {
    params: z.object({ formUuid: z.string(), responseUuid: z.string() }),
  },
  responses: {
    200: { description: "Form response" },
    401: { description: "Unauthorized" },
    404: { description: "Form response not found" },
    500: { description: "Server error" },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: "delete",
  path: "/v1/manager/forms/{formUuid}/responses/{responseUuid}",
  tags: ["Manager - Form Responses"],
  summary: "Delete a form response",
  request: {
    params: z.object({ formUuid: z.string(), responseUuid: z.string() }),
  },
  responses: {
    200: { description: "Deleted" },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden" },
    404: { description: "Form response not found" },
    500: { description: "Server error" },
  },
  security: [{ bearerAuth: [] }],
});

const router = Router();

router.post("/:formUuid/responses", submitForm);

router.use(requireAuth, requireVerifiedTeam);

// Forms
router.post("/", createForm);
router.delete("/:formUuid", deleteForm);
router.get("/", getForms);
router.put("/:formUuid", updateFormName);

// Form parts
router.post("/:formUuid/parts", createFormPart);
router.delete("/:formUuid/parts/:uuid", deleteFormPart);
router.get("/:formUuid/parts/:uuid", getFormPart);
router.put("/:formUuid/parts/:uuid", updateFormPart);
router.put("/:formUuid/parts/:uuid/reorder", reorderFormParts);

// Form responses — submitForm is unauthenticated
router.use(requireAuth, requireVerifiedTeam);
router.get("/:formUuid/responses", getFormResponses);
router.get("/:formUuid/responses/:responseUuid", getFormResponse);
router.delete("/:formUuid/responses/:responseUuid", deleteFormResponse);

export default router;
