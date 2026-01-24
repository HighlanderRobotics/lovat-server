import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth.js";
import { updateSettings } from "../../handler/manager/settings/updateSettings.js";
import rateLimit from "express-rate-limit";
import { updateTeamEmail } from "../../handler/manager/settings/updateTeamEmail.js";
import { getTeamSource } from "../../handler/manager/settings/getTeamSource.js";
import { addTeamSource } from "../../handler/manager/settings/addTeamSource.js";
import { getTournamentSource } from "../../handler/manager/settings/getTournamentSource.js";
import { addTournamentSource } from "../../handler/manager/settings/addTournamentSource.js";
import { registry } from "../../lib/openapi.js";
import { z } from "zod";

const updateTeamEmails = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: 3,
  message:
    "Too many email updates sent from this IP, please try again after 2 minutes",
  validate: { trustProxy: false },
});

const router = Router();

registry.registerPath({
  method: "put",
  path: "/v1/manager/settings",
  tags: ["Manager - Settings"],
  summary: "Update settings",
  request: { body: { content: { "application/json": { schema: z.object({ timezone: z.string().optional() }) } } } },
  responses: { 200: { description: "Updated" }, 400: { description: "Invalid request" }, 401: { description: "Unauthorized" } },
  security: [{ bearerAuth: [] }],
});
registry.registerPath({
  method: "get",
  path: "/v1/manager/settings/teamsource",
  tags: ["Manager - Settings"],
  summary: "Get team source",
  responses: { 200: { description: "Team source", content: { "application/json": { schema: z.object({ source: z.string() }) } } }, 401: { description: "Unauthorized" } },
  security: [{ bearerAuth: [] }],
});
registry.registerPath({
  method: "post",
  path: "/v1/manager/settings/teamsource",
  tags: ["Manager - Settings"],
  summary: "Add team source",
  request: { body: { content: { "application/json": { schema: z.object({ source: z.string() }) } } } },
  responses: { 200: { description: "Added" }, 400: { description: "Invalid request" } },
  security: [{ bearerAuth: [] }],
});
registry.registerPath({
  method: "get",
  path: "/v1/manager/settings/tournamentsource",
  tags: ["Manager - Settings"],
  summary: "Get tournament source",
  responses: { 200: { description: "Tournament source", content: { "application/json": { schema: z.object({ source: z.string() }) } } }, 401: { description: "Unauthorized" } },
  security: [{ bearerAuth: [] }],
});
registry.registerPath({
  method: "post",
  path: "/v1/manager/settings/tournamentsource",
  tags: ["Manager - Settings"],
  summary: "Add tournament source",
  request: { body: { content: { "application/json": { schema: z.object({ source: z.string() }) } } } },
  responses: { 200: { description: "Added" }, 400: { description: "Invalid request" } },
  security: [{ bearerAuth: [] }],
});
registry.registerPath({
  method: "put",
  path: "/v1/manager/settings/teamemail",
  tags: ["Manager - Settings"],
  summary: "Update team email",
  request: { body: { content: { "application/json": { schema: z.object({ email: z.string().email() }) } } } },
  responses: { 200: { description: "Updated" }, 400: { description: "Invalid request" }, 401: { description: "Unauthorized" } },
  security: [{ bearerAuth: [] }],
});

router.use(requireAuth);

router.put("/", updateSettings);

router.get("/teamsource", getTeamSource);
router.post("/teamsource", addTeamSource);

router.get("/tournamentsource", getTournamentSource);
router.post("/tournamentsource", addTournamentSource);

router.put("/teamemail", updateTeamEmails, updateTeamEmail);

export default router;
