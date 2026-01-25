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
  summary: "Update sources",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            teamSource: z.array(z.number().int()),
            tournamentSource: z.array(z.string()),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: "Updated", content: { "text/plain": { schema: z.string() } } },
    400: { description: "Invalid request" },
    401: { description: "Unauthorized" },
    500: { description: "Server error" },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: "get",
  path: "/v1/manager/settings/teamsource",
  tags: ["Manager - Settings"],
  summary: "Get team source",
  responses: {
    200: {
      description: "Team source",
      content: {
        "application/json": {
          schema: z.union([
            z.literal("THIS_TEAM"),
            z.literal("ALL_TEAMS"),
            z.array(z.number().int()),
          ]),
        },
      },
    },
    401: { description: "Unauthorized" },
    500: { description: "Server error" },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: "post",
  path: "/v1/manager/settings/teamsource",
  tags: ["Manager - Settings"],
  summary: "Add team source",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.union([
            z.object({ mode: z.literal("ALL_TEAMS") }),
            z.object({ mode: z.literal("THIS_TEAM") }),
            z.object({ teams: z.array(z.number().int()) }),
          ]),
        },
      },
    },
  },
  responses: {
    200: { description: "Added", content: { "text/plain": { schema: z.string() } } },
    400: { description: "Invalid request" },
    401: { description: "Unauthorized" },
    403: { description: "Not affiliated with a team" },
    500: { description: "Server error" },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: "get",
  path: "/v1/manager/settings/tournamentsource",
  tags: ["Manager - Settings"],
  summary: "Get tournament source",
  responses: {
    200: { description: "Tournament source", content: { "application/json": { schema: z.array(z.string()) } } },
    401: { description: "Unauthorized" },
    500: { description: "Server error" },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: "post",
  path: "/v1/manager/settings/tournamentsource",
  tags: ["Manager - Settings"],
  summary: "Add tournament source",
  request: { body: { content: { "application/json": { schema: z.object({ tournaments: z.array(z.string()) }) } } } },
  responses: {
    200: { description: "Added", content: { "text/plain": { schema: z.string() } } },
    400: { description: "Invalid request" },
    401: { description: "Unauthorized" },
    500: { description: "Server error" },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: "put",
  path: "/v1/manager/settings/teamemail",
  tags: ["Manager - Settings"],
  summary: "Update team email",
  request: { query: z.object({ email: z.string().email() }) },
  responses: {
    200: { description: "Verification sent", content: { "text/plain": { schema: z.string() } } },
    400: { description: "Invalid request" },
    401: { description: "Unauthorized" },
    404: { description: "Team not found" },
    429: { description: "Rate limited" },
    500: { description: "Server error" },
  },
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
