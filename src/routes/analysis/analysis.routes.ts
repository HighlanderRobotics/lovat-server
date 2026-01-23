import { alliancePageResponse } from "../../handler/analysis/alliancePredictions/alliancePageResponse.js";
import { matchPrediction } from "../../handler/analysis/alliancePredictions/matchPrediction.js";
import { picklistShell } from "../../handler/analysis/picklist/picklistShell.js";
import { pitDisplay } from "../../handler/manager/pitDisplay.js";
import { requireAuth } from "../../lib/middleware/requireAuth.js";
import { Router } from "express";
import teamLookup from "./teamLookup.routes.js";
import csv from "./csv.routes.js";
import scoutReport from "./scoutreport.routes.js";
import { registry } from "../../lib/openapi.js";
import { z } from "zod";

const router = Router();

// OpenAPI docs for analysis endpoints
const AlliancePathPosition = z.object({
  location: z.number(),
  event: z.number(),
  time: z.number().optional(),
});
const AlliancePath = z.object({
  positions: z.array(AlliancePathPosition),
  matches: z.array(z.object({ matchKey: z.string(), tournamentName: z.string() })),
  score: z.array(z.number()),
  frequency: z.number(),
  maxScore: z.number(),
});
const AllianceTeam = z.object({
  team: z.number(),
  role: z.number(),
  averagePoints: z.number(),
  paths: z.array(AlliancePath),
});
const AllianceResponseSchema = z.object({
  totalPoints: z.number(),
  teams: z.array(AllianceTeam),
  l1StartTime: z.array(z.number().nullable()).length(3),
  l2StartTime: z.array(z.number().nullable()).length(3),
  l3StartTime: z.array(z.number().nullable()).length(3),
  totalFuelOutputted: z.number(),
  totalBallThroughput: z.number(),
});

registry.registerPath({
  method: "get",
  path: "/v1/analysis/pitdisplay",
  tags: ["Analysis"],
  summary: "Public pit display data for a team/event",
  request: {
    query: z.object({
      team: z.coerce.number().int(),
      tournamentKey: z.string(),
      topTeamCount: z.coerce.number().int(),
      teamsAboveCount: z.coerce.number().int(),
    }),
  },
  responses: {
    200: { description: "Pit display payload", content: { "application/json": { schema: z.any() } } },
    400: { description: "Invalid parameters" },
    500: { description: "Error generating display" },
  },
});

registry.registerPath({
  method: "get",
  path: "/v1/analysis/alliance",
  tags: ["Analysis"],
  summary: "Alliance analysis for three teams",
  request: {
    query: z.object({
      teamOne: z.coerce.number().int(),
      teamTwo: z.coerce.number().int(),
      teamThree: z.coerce.number().int(),
    }),
  },
  responses: {
    200: {
      description: "Alliance composition and metrics",
      content: { "application/json": { schema: AllianceResponseSchema } },
    },
    400: { description: "Invalid parameters" },
  },
});

const MatchPredictionResponseSchema = z.union([
  z.object({
    red1: z.number(),
    red2: z.number(),
    red3: z.number(),
    blue1: z.number(),
    blue2: z.number(),
    blue3: z.number(),
    redWinning: z.number(),
    blueWinning: z.number(),
    winningAlliance: z.number(),
    redAlliance: AllianceResponseSchema,
    blueAlliance: AllianceResponseSchema,
  }),
  z.object({ error: z.literal("not enough data") }),
]);

registry.registerPath({
  method: "get",
  path: "/v1/analysis/matchprediction",
  tags: ["Analysis"],
  summary: "Predict match outcome for two alliances",
  request: {
    query: z.object({
      red1: z.coerce.number().int(),
      red2: z.coerce.number().int(),
      red3: z.coerce.number().int(),
      blue1: z.coerce.number().int(),
      blue2: z.coerce.number().int(),
      blue3: z.coerce.number().int(),
    }),
  },
  responses: {
    200: { description: "Prediction and alliance details", content: { "application/json": { schema: MatchPredictionResponseSchema } } },
    400: { description: "Invalid parameters" },
  },
});

const PicklistEntrySchema = z.object({
  team: z.number(),
  result: z.number(),
  breakdown: z.array(z.object({ type: z.string(), result: z.number() })),
  unweighted: z.array(z.object({ type: z.string(), result: z.number() })),
  flags: z.array(z.object({ type: z.string(), result: z.number() })),
});

registry.registerPath({
  method: "get",
  path: "/v1/analysis/picklist",
  tags: ["Analysis"],
  summary: "Compute picklist rankings for a tournament",
  request: {
    query: z.object({
      tournamentKey: z.string().optional(),
      flags: z.string().optional(),
      stage: z.string().optional(),
      totalPoints: z.coerce.number().optional(),
      autoPoints: z.coerce.number().optional(),
      teleopPoints: z.coerce.number().optional(),
      driverAbility: z.coerce.number().optional(),
      climbResult: z.coerce.number().optional(),
      autoClimb: z.coerce.number().optional(),
      defenseEffectiveness: z.coerce.number().optional(),
      contactDefenseTime: z.coerce.number().optional(),
      campingDefenseTime: z.coerce.number().optional(),
      totalDefensiveTime: z.coerce.number().optional(),
      totalFuelThroughput: z.coerce.number().optional(),
      totalFuelFed: z.coerce.number().optional(),
      feedingRate: z.coerce.number().optional(),
      scoringRate: z.coerce.number().optional(),
      estimatedSuccessfulFuelRate: z.coerce.number().optional(),
      estimatedTotalFuelScored: z.coerce.number().optional(),
    }),
  },
  responses: {
    200: { description: "Picklist ranking results", content: { "application/json": { schema: z.object({ teams: z.array(PicklistEntrySchema) }) } } },
    400: { description: "Invalid parameters" },
  },
});

router.get("/pitdisplay", pitDisplay);

router.use(requireAuth);

router.use(teamLookup);
router.use(csv);
router.use(scoutReport);

router.get("/alliance", alliancePageResponse);

router.get("/matchprediction", matchPrediction);
router.get("/picklist", picklistShell);

export default router;
