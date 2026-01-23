import { Router } from "express";

import onboarding from "./onboarding.routes.js";
import picklists from "./picklists.routes.js";
import mutablepicklist from "./mutablepicklists.routes.js";
import registeredteams from "./registeredteams.routes.js";
import scouters from "./scouters.routes.js";
import tournaments from "./tournaments.routes.js";
import scoutreports from "./scoutreports.routes.js";
import settings from "./settings.routes.js";
//import apikey from "./apikey.routes.js";

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
});

router.use("/onboarding", onboarding);
router.use("/picklists", picklists);
router.use("/mutablepicklists", mutablepicklist);
router.use("/registeredteams", registeredteams);
router.use("/", scouters);
router.use("/tournament", tournaments);
router.use("/scoutreports", scoutreports);
router.use("/settings", settings);
//router.use("/apikey", apikey);

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
