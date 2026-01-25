import { Router } from "express";

import onboarding from "./onboarding.routes.js";
import picklists from "./picklists.routes.js";
import mutablepicklist from "./mutablepicklists.routes.js";
import registeredteams from "./registeredteams.routes.js";
import scouters from "./scouters.routes.js";
import tournaments from "./tournaments.routes.js";
import scoutreports from "./scoutreports.routes.js";
import settings from "./settings.routes.js";
import apikey from "./apikey.routes.js";

import { getTournaments } from "../../handler/manager/getTournaments.js";
import { getTeams } from "../../handler/manager/getTeams.js";
import { requireAuth } from "../../lib/middleware/requireAuth.js";
import { getMatches } from "../../handler/manager/getMatches.js";
import { updateNotes } from "../../handler/manager/updateNotes.js";
import { getScouters } from "../../handler/manager/scouters/getScouters.js";
import { getProfile } from "../../handler/manager/getProfile.js";
import { getUsers } from "../../handler/manager/getUsers.js";
import { deleteUser } from "../../handler/manager/deleteUser.js";
import { updateRoleToScoutingLead } from "../../handler/manager/scouters/updateRoleToScoutingLead.js";
import { getAnalysts } from "../../handler/manager/getAnalysts.js";
import { addNotOnTeam } from "../../handler/manager/addNotOnTeam.js";
import { getTeamCode } from "../../handler/manager/getTeamCode.js";
import { addScoutReportDashboard } from "../../handler/manager/scoutreports/addScoutReportDashboard.js";
import { getTeamTournamentStatus } from "../../handler/manager/getTeamTournamentStatus.js";
import { getMatchResults } from "../../handler/manager/getMatchResults.js";
import { registry } from "../../lib/openapi.js";
import { z } from "zod";
import { TeamSchema, TournamentSchema } from "../../lib/prisma-zod.js";

const router = Router();

// OpenAPI documentation for selected manager endpoints
const PaginationQuery = z.object({
  take: z.coerce.number().int().optional(),
  skip: z.coerce.number().int().optional(),
});

registry.registerPath({
  method: "get",
  path: "/v1/manager/teams",
  tags: ["Manager - Teams"],
  summary: "List teams with optional pagination and filter",
  request: {
    query: PaginationQuery.extend({ filter: z.string().optional() }),
  },
  responses: {
    200: {
      description: "Teams and total count",
      content: {
        "application/json": {
          schema: z.object({ teams: z.array(TeamSchema), count: z.number() }),
        },
      },
    },
    401: { description: "Unauthorized" },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: "get",
  path: "/v1/manager/tournaments",
  tags: ["Manager - Tournaments"],
  summary: "List tournaments with optional pagination and filter",
  request: {
    query: PaginationQuery.extend({ filter: z.string().optional() }),
  },
  responses: {
    200: {
      description: "Tournaments and total count",
      content: {
        "application/json": {
          schema: z.object({ tournaments: z.array(TournamentSchema), count: z.number() }),
        },
      },
    },
    401: { description: "Unauthorized" },
  },
  security: [{ bearerAuth: [] }],
});

const MatchTeamSchema = z.object({
  number: z.number().int(),
  scouters: z.array(z.object({ name: z.string(), scouted: z.boolean() })),
  externalReports: z.number().int(),
});

const MatchSchema = z.object({
  matchNumber: z.number().int(),
  matchType: z.number().int(),
  scouted: z.boolean(),
  finished: z.boolean(),
  team1: MatchTeamSchema,
  team2: MatchTeamSchema,
  team3: MatchTeamSchema,
  team4: MatchTeamSchema,
  team5: MatchTeamSchema,
  team6: MatchTeamSchema,
});

registry.registerPath({
  method: "get",
  path: "/v1/manager/matches/{tournament}",
  tags: ["Manager - Matches"],
  summary: "List matches for a tournament",
  request: {
    params: z.object({ tournament: z.string() }),
    query: z.object({ teams: z.string().optional() }),
  },
  responses: {
    200: {
      description: "Formatted match list",
      content: { "application/json": { schema: z.array(MatchSchema) } },
    },
    400: { description: "Invalid parameters" },
    401: { description: "Unauthorized" },
  },
  security: [{ bearerAuth: [] }],
});

// Profile
const ProfileSchema = z.object({
  id: z.string(),
  username: z.string().nullable(),
  email: z.string().email(),
  role: z.string(),
  team: z
    .object({
      team: z.object({ number: z.number().int(), name: z.string().nullable() }),
    })
    .nullable(),
});
registry.registerPath({
  method: "get",
  path: "/v1/manager/profile",
  tags: ["Manager - Account"],
  summary: "Get current user profile",
  responses: {
    200: { description: "Profile", content: { "application/json": { schema: ProfileSchema.nullable() } } },
    401: { description: "Unauthorized" },
  },
  security: [{ bearerAuth: [] }],
});

// Users list
registry.registerPath({
  method: "get",
  path: "/v1/manager/users",
  tags: ["Manager - Users"],
  summary: "List users",
  responses: {
    200: { description: "Users", content: { "application/json": { schema: z.array(z.object({ id: z.string(), email: z.string().email(), username: z.string().nullable(), role: z.string() })) } } },
    401: { description: "Unauthorized" },
  },
  security: [{ bearerAuth: [] }],
});

// Delete user
registry.registerPath({
  method: "delete",
  path: "/v1/manager/user",
  tags: ["Manager - Users"],
  summary: "Delete the current user",
  responses: {
    200: { description: "Deleted" },
    401: { description: "Unauthorized" },
  },
  security: [{ bearerAuth: [] }],
});

// Upgrade user role to scouting lead
registry.registerPath({
  method: "post",
  path: "/v1/manager/upgradeuser",
  tags: ["Manager - Users"],
  summary: "Upgrade current user to Scouting Lead",
  responses: {
    200: { description: "Upgraded" },
    401: { description: "Unauthorized" },
    400: { description: "Invalid request" },
  },
  security: [{ bearerAuth: [] }],
});

// Analysts
registry.registerPath({
  method: "get",
  path: "/v1/manager/analysts",
  tags: ["Manager - Users"],
  summary: "List analysts",
  responses: {
    200: { description: "Analysts", content: { "application/json": { schema: z.array(z.object({ id: z.string(), username: z.string().nullable() })) } } },
    401: { description: "Unauthorized" },
  },
  security: [{ bearerAuth: [] }],
});

// Team code
registry.registerPath({
  method: "get",
  path: "/v1/manager/code",
  tags: ["Manager - Teams"],
  summary: "Get team code for current user",
  responses: {
    200: { description: "Team code", content: { "application/json": { schema: z.object({ code: z.string() }) } } },
    401: { description: "Unauthorized" },
  },
  security: [{ bearerAuth: [] }],
});

// Dashboard scoutreport creation
registry.registerPath({
  method: "post",
  path: "/v1/manager/dashboard/scoutreport",
  tags: ["Manager - Scout Reports"],
  summary: "Create scout report from dashboard",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({ match: z.number().int(), team: z.number().int(), notes: z.string().optional() }),
        },
      },
    },
  },
  responses: {
    200: { description: "Created", content: { "application/json": { schema: z.object({ uuid: z.string() }) } } },
    401: { description: "Unauthorized" },
    400: { description: "Invalid request" },
  },
  security: [{ bearerAuth: [] }],
});

// Team tournament status
registry.registerPath({
  method: "get",
  path: "/v1/manager/team-tournament-status",
  tags: ["Manager - Tournaments"],
  summary: "Get status of current team in tournaments",
  responses: {
    200: { description: "Status", content: { "application/json": { schema: z.object({ tournaments: z.array(z.object({ id: z.string(), code: z.string(), status: z.string() })) }) } } },
    401: { description: "Unauthorized" },
  },
  security: [{ bearerAuth: [] }],
});

// Match results page
registry.registerPath({
  method: "get",
  path: "/v1/manager/match-results-page",
  tags: ["Manager - Matches"],
  summary: "Get match results page data",
  responses: {
    200: { description: "Results", content: { "application/json": { schema: z.object({ matches: z.array(MatchSchema) }) } } },
    401: { description: "Unauthorized" },
  },
  security: [{ bearerAuth: [] }],
});

// Update notes (Scouting Lead only)
registry.registerPath({
  method: "put",
  path: "/v1/manager/notes/{uuid}",
  tags: ["Manager - Notes"],
  summary: "Update scout report notes (SCOUTING_LEAD)",
  request: {
    params: z.object({ uuid: z.string() }),
    body: { content: { "application/json": { schema: z.object({ note: z.string() }) } } },
  },
  responses: {
    200: { description: "Note updated" },
    400: { description: "Invalid request" },
    401: { description: "Unauthorized" },
    403: { description: "Not authorized" },
  },
  security: [{ bearerAuth: [] }],
});

// Scoutershift scouters
registry.registerPath({
  method: "get",
  path: "/v1/manager/scoutershift/scouters",
  tags: ["Manager - Scouters"],
  summary: "List scouters for current team",
  request: { query: z.object({ archived: z.string().optional() }) },
  responses: {
    200: { description: "Scouters", content: { "application/json": { schema: z.array(z.object({ uuid: z.string(), name: z.string().nullable() })) } } },
    401: { description: "Unauthorized" },
    403: { description: "User not affiliated with a team" },
  },
  security: [{ bearerAuth: [] }],
});

// Set user as not on a team
registry.registerPath({
  method: "post",
  path: "/v1/manager/noteam",
  tags: ["Manager - Users"],
  summary: "Set current user to ANALYST and remove team",
  responses: {
    200: { description: "Updated", content: { "application/json": { schema: z.object({ id: z.string(), role: z.string(), teamNumber: z.number().nullable() }) } } },
    401: { description: "Unauthorized" },
  },
  security: [{ bearerAuth: [] }],
});

router.use("/onboarding", onboarding);
router.use("/picklists", picklists);
router.use("/mutablepicklists", mutablepicklist);
router.use("/registeredteams", registeredteams);
router.use("/", scouters);
router.use("/tournament", tournaments);
router.use("/scoutreports", scoutreports);
router.use("/settings", settings);
router.use("/apikey", apikey);

router.get("/teams", requireAuth, getTeams);
router.get("/tournaments", requireAuth, getTournaments);

router.get("/matches/:tournament", requireAuth, getMatches);

router.put("/notes/:uuid", requireAuth, updateNotes);
router.get("/scoutershift/scouters", requireAuth, getScouters);

router.get("/profile", requireAuth, getProfile);

router.get("/users", requireAuth, getUsers);

router.delete("/user", requireAuth, deleteUser);

router.post("/upgradeuser", requireAuth, updateRoleToScoutingLead);
router.get("/analysts", requireAuth, getAnalysts);

router.post("/noteam", requireAuth, addNotOnTeam);

router.get("/code", requireAuth, getTeamCode);

router.post("/dashboard/scoutreport", requireAuth, addScoutReportDashboard);

router.get("/team-tournament-status", requireAuth, getTeamTournamentStatus);

router.get("/match-results-page", requireAuth, getMatchResults);

export default router;
