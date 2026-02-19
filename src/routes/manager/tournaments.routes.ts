import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth.js";
import { getTeamsInTournament } from "../../handler/manager/tournament/getTeamsInTournament.js";
import { getTeamRankings } from "../../handler/manager/tournament/getTeamRankings.js";
import { addScouterShift } from "../../handler/manager/tournament/addScouterShift.js";
import { getScouterSchedule } from "../../handler/manager/tournament/getScouterSchedule.js";
import { registry } from "../../lib/openapi.js";
import { z } from "zod";
import { TeamSchema, ScouterScheduleShiftSchema } from "../../lib/prisma-zod.js";

/*

 tournaments.routes.ts
 
 GET    /manager/tournaments
 GET    /manager/tournament/:tournament/teams
 GET    /manager/tournament/:tournament/rankedTeams
 GET    /manager/tournament/:tournament/scoutershifts
 
 */

const TournamentParamSchema = z.object({ tournament: z.string() });

const ScouterTeamRelationSchema = z.object({ name: z.string().nullable(), uuid: z.string() }).nullable();

const ScouterScheduleShiftWithTeamsSchema = ScouterScheduleShiftSchema.extend({
  team1: ScouterTeamRelationSchema,
  team2: ScouterTeamRelationSchema,
  team3: ScouterTeamRelationSchema,
  team4: ScouterTeamRelationSchema,
  team5: ScouterTeamRelationSchema,
  team6: ScouterTeamRelationSchema,
});

registry.registerPath({
  method: "get",
  path: "/v1/manager/tournament/{tournament}/teams",
  tags: ["Manager - Tournaments"],
  summary: "List teams in tournament",
  request: { params: TournamentParamSchema },
  responses: { 200: { description: "Teams", content: { "application/json": { schema: z.array(TeamSchema) } } }, 401: { description: "Unauthorized" }, 500: { description: "Server error" } },
  security: [{ bearerAuth: [] }],
});
registry.registerPath({
  method: "get",
  path: "/v1/manager/tournament/{tournament}/rankedTeams",
  tags: ["Manager - Tournaments"],
  summary: "Ranked teams",
  request: { params: TournamentParamSchema },
  responses: { 200: { description: "Rankings", content: { "application/json": { schema: z.array(z.object({ number: z.number().int(), name: z.string(), rank: z.number().int().nullable(), rankingPoints: z.number().int().nullable(), matchesPlayed: z.number().int().nullable() })) } } } , 500: { description: "Server error" } },
  security: [{ bearerAuth: [] }],
});
registry.registerPath({
  method: "post",
  path: "/v1/manager/tournament/{tournament}/scoutershifts",
  tags: ["Manager - Tournaments"],
  summary: "Create scouter shift",
  request: {
    params: TournamentParamSchema,
    body: {
      content: {
        "application/json": {
          schema: z.object({
            startMatchOrdinalNumber: z.number().int(),
            endMatchOrdinalNumber: z.number().int(),
            team1: z.array(z.string()),
            team2: z.array(z.string()),
            team3: z.array(z.string()),
            team4: z.array(z.string()),
            team5: z.array(z.string()),
            team6: z.array(z.string()),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: "Created" },
    400: { description: "Invalid request, overlapping scouters, or overlapping shift matches" },
    401: { description: "Unauthorized" },
    403: { description: "API key forbidden or user role not SCOUTING_LEAD" },
    500: { description: "Server error" },
  },
  security: [{ bearerAuth: [] }],
});
registry.registerPath({
  method: "get",
  path: "/v1/manager/tournament/{tournament}/scoutershifts",
  tags: ["Manager - Tournaments"],
  summary: "List scouter shifts",
  request: { params: TournamentParamSchema },
  responses: { 200: { description: "Shifts", content: { "application/json": { schema: z.object({ hash: z.string(), data: z.array(ScouterScheduleShiftWithTeamsSchema) }) } } }, 401: { description: "Unauthorized" }, 403: { description: "User not affiliated with a team" }, 500: { description: "Server error" } },
  security: [{ bearerAuth: [] }],
});

const router = Router();

router.use(requireAuth);

router.get("/:tournament/teams", getTeamsInTournament);

router.get("/:tournament/rankedTeams", getTeamRankings);

router.post("/:tournament/scoutershifts", addScouterShift);

router.get("/:tournament/scoutershifts", getScouterSchedule);

export default router;

