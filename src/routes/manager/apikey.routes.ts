import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth.js";
import { addApiKey } from "../../handler/manager/apikey/addApiKey.js";
import { getApiKeys } from "../../handler/manager/apikey/getApiKeys.js";
import { renameApiKey } from "../../handler/manager/apikey/renameApiKey.js";
import { revokeApiKey } from "../../handler/manager/apikey/revokeApiKey.js";
import { registry } from "../../lib/openapi.js";
import { z } from "zod";

// OpenAPI docs for API key management (JWT required)
registry.registerPath({
  method: "post",
  path: "/v1/manager/apikey",
  tags: ["Manager - API Keys"],
  summary: "Create a new API key",
  description: "JWT required; API keys (lvt-...) are not permitted for this endpoint.",
  request: { query: z.object({ name: z.string() }) },
  responses: {
    200: { description: "Created", content: { "application/json": { schema: z.object({ apiKey: z.string() }) } } },
    400: { description: "Invalid request parameters" },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden for API key auth" },
  },
  security: [{ bearerAuth: [] }],
});
registry.registerPath({
  method: "delete",
  path: "/v1/manager/apikey",
  tags: ["Manager - API Keys"],
  summary: "Revoke an API key",
  description: "JWT required; API keys (lvt-...) are not permitted for this endpoint.",
  request: { query: z.object({ uuid: z.string() }) },
  responses: {
    200: { description: "Revoked", content: { "application/json": { schema: z.string() } } },
    400: { description: "Invalid request parameters" },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden for API key auth" },
  },
  security: [{ bearerAuth: [] }],
});
registry.registerPath({
  method: "patch",
  path: "/v1/manager/apikey",
  tags: ["Manager - API Keys"],
  summary: "Rename an API key",
  description: "JWT required; API keys (lvt-...) are not permitted for this endpoint.",
  request: { query: z.object({ uuid: z.string(), newName: z.string() }) },
  responses: {
    200: { description: "Renamed", content: { "application/json": { schema: z.string() } } },
    400: { description: "Invalid request parameters" },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden for API key auth" },
  },
  security: [{ bearerAuth: [] }],
});
registry.registerPath({
  method: "get",
  path: "/v1/manager/apikey",
  tags: ["Manager - API Keys"],
  summary: "List API keys",
  description: "Returns current user's API keys. Accepts JWT or API keys.",
  responses: {
    200: { description: "Keys", content: { "application/json": { schema: z.array(z.object({ uuid: z.string(), name: z.string(), requests: z.number().int() })) } } },
    401: { description: "Unauthorized" },
  },
  security: [{ bearerAuth: [] }],
});

const router = Router();

router.use(requireAuth);

router.post("/", addApiKey);
router.delete("/", revokeApiKey);
router.get("/", getApiKeys);
router.patch("/", renameApiKey);

export default router;
