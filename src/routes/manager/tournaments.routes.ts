import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth.js";
import { getTeamsInTournament } from "../../handler/manager/tournament/getTeamsInTournament.js";
import { getTeamRankings } from "../../handler/manager/tournament/getTeamRankings.js";
import { addScouterShift } from "../../handler/manager/tournament/addScouterShift.js";
import { getScouterSchedule } from "../../handler/manager/tournament/getScouterSchedule.js";
import { registry } from "../../lib/openapi.js";
import { z } from "zod";

/*

 tournaments.routes.ts
 
 GET    /manager/tournaments
 GET    /manager/tournament/:tournament/teams
 GET    /manager/tournament/:tournament/rankedTeams
 GET    /manager/tournament/:tournament/scoutershifts
 
 */

const TournamentParamSchema = z.object({ tournament: z.string() });

registry.registerPath({
  method: "get",
  path: "/v1/manager/tournament/{tournament}/teams",
  tags: ["Manager - Tournaments"],
  summary: "List teams in tournament",
  request: { params: TournamentParamSchema },
  responses: { 200: { description: "Teams", content: { "application/json": { schema: z.array(z.object({ number: z.number().int(), name: z.string().nullable() })) } } }, 401: { description: "Unauthorized" } },
  security: [{ bearerAuth: [] }],
});
registry.registerPath({
  method: "get",
  path: "/v1/manager/tournament/{tournament}/rankedTeams",
  tags: ["Manager - Tournaments"],
  summary: "Ranked teams",
  request: { params: TournamentParamSchema },
  responses: { 200: { description: "Rankings", content: { "application/json": { schema: z.array(z.object({ number: z.number().int(), rank: z.number().int() })) } } } },
  security: [{ bearerAuth: [] }],
});
registry.registerPath({
  method: "post",
  path: "/v1/manager/tournament/{tournament}/scoutershifts",
  tags: ["Manager - Tournaments"],
  summary: "Create scouter shift",
  request: { params: TournamentParamSchema, body: { content: { "application/json": { schema: z.object({ uuid: z.string().optional(), scouterId: z.string(), matchNumber: z.number().int() }) } } } },
  responses: { 200: { description: "Created" }, 400: { description: "Invalid request" } },
  security: [{ bearerAuth: [] }],
});
registry.registerPath({
  method: "get",
  path: "/v1/manager/tournament/{tournament}/scoutershifts",
  tags: ["Manager - Tournaments"],
  summary: "List scouter shifts",
  request: { params: TournamentParamSchema },
  responses: { 200: { description: "Shifts", content: { "application/json": { schema: z.array(z.object({ scouterId: z.string(), matchNumber: z.number().int() })) } } } },
  security: [{ bearerAuth: [] }],
});

const router = Router();

router.use(requireAuth);

router.get("/:tournament/teams", getTeamsInTournament);

router.get("/:tournament/rankedTeams", getTeamRankings);

router.post("/:tournament/scoutershifts", addScouterShift);

router.get("/:tournament/scoutershifts", getScouterSchedule);

export default router;

