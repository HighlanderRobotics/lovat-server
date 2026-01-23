import { z } from "zod";
import { OpenAPIRegistry, extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

// Ensure this module's Zod instance has .openapi
extendZodWithOpenApi(z);

// Enums (mirrored from prisma/schema.prisma)
export const PositionSchema = z.enum([
  "LEFT_TRENCH",
  "LEFT_BUMP",
  "HUB",
  "RIGHT_TRENCH",
  "RIGHT_BUMP",
  "NEUTRAL_ZONE",
  "DEPOT",
  "OUTPOST",
  "NONE",
]);

export const EventActionSchema = z.enum([
  "START_SCORING",
  "STOP_SCORING",
  "START_MATCH",
  "START_CAMPING",
  "STOP_CAMPING",
  "START_DEFENDING",
  "STOP_DEFENDING",
  "INTAKE",
  "OUTTAKE",
  "DISRUPT",
  "CROSS",
  "CLIMB",
  "START_FEEDING",
  "STOP_FEEDING",
]);

export const MobilitySchema = z.enum(["TRENCH", "BUMP", "BOTH", "NONE"]);
export const BeachedSchema = z.enum(["ON_FUEL", "ON_BUMP", "BOTH", "NEITHER"]);
export const EndgameClimbSchema = z.enum(["NOT_ATTEMPTED", "FAILED", "L1", "L2", "L3"]);
export const ClimbPositionSchema = z.enum(["SIDE", "MIDDLE"]);
export const ClimbSideSchema = z.enum(["FRONT", "BACK"]);
export const AutoClimbSchema = z.enum(["NOT_ATTEMPTED", "FAILED", "SUCCEEDED"]);
export const FeederTypeSchema = z.enum(["CONTINUOUS", "STOP_TO_SHOOT", "DUMP"]);
export const IntakeTypeSchema = z.enum(["GROUND", "OUTPOST", "BOTH", "NEITHER"]);
export const RobotRoleSchema = z.enum(["CYCLING", "SCORING", "FEEDING", "DEFENDING", "IMMOBILE"]);
export const WarningTypeSchema = z.enum(["BREAK"]);
export const UserRoleSchema = z.enum(["ANALYST", "SCOUTING_LEAD"]);
export const MatchTypeSchema = z.enum(["QUALIFICATION", "ELIMINATION"]);

// Common JSON rule shapes used in User
export const DataSourceRuleNumberSchema = z.object({
  mode: z.enum(["INCLUDE", "EXCLUDE"]),
  items: z.array(z.number()),
});
export const DataSourceRuleStringSchema = z.object({
  mode: z.enum(["INCLUDE", "EXCLUDE"]),
  items: z.array(z.string()),
});

// Models: include scalar fields and foreign keys. Relation objects are omitted to avoid cycles.
export const EventSchema = z.object({
  eventUuid: z.string().uuid(),
  time: z.number().int(),
  action: EventActionSchema,
  position: PositionSchema,
  points: z.number().int(),
  scoutReportUuid: z.string().uuid(),
});

export const FeatureToggleSchema = z.object({
  feature: z.string(),
  enabled: z.boolean(),
});

export const TeamMatchDataSchema = z.object({
  key: z.string(),
  tournamentKey: z.string(),
  matchNumber: z.number().int(),
  teamNumber: z.number().int(),
  matchType: MatchTypeSchema,
});

export const MutablePicklistSchema = z.object({
  uuid: z.string().uuid(),
  teams: z.array(z.number().int()),
  authorId: z.string(),
  name: z.string(),
  tournamentKey: z.string().nullable().optional(),
});

export const ScoutReportSchema = z.object({
  uuid: z.string().uuid(),
  teamMatchKey: z.string(),
  startTime: z.string().datetime(),
  notes: z.string(),
  robotRoles: z.array(RobotRoleSchema),
  driverAbility: z.number().int(),
  scouterUuid: z.string().uuid(),
  robotBrokeDescription: z.string().optional().nullable(),
  // year-specific fields
  accuracy: z.number().int(),
  beached: BeachedSchema,
  climbPosition: ClimbPositionSchema.optional().nullable(),
  climbSide: ClimbSideSchema.optional().nullable(),
  defenseEffectiveness: z.number().int(),
  feederTypes: z.array(FeederTypeSchema),
  intakeType: IntakeTypeSchema,
  mobility: MobilitySchema,
  scoresWhileMoving: z.boolean(),
  disrupts: z.boolean(),
  endgameClimb: EndgameClimbSchema,
  autoClimb: AutoClimbSchema,
});

export const ScouterScheduleShiftSchema = z.object({
  uuid: z.string().uuid(),
  sourceTeamNumber: z.number().int(),
  tournamentKey: z.string(),
  startMatchOrdinalNumber: z.number().int(),
  endMatchOrdinalNumber: z.number().int(),
});

export const ScouterSchema = z.object({
  uuid: z.string().uuid(),
  name: z.string().optional().nullable(),
  sourceTeamNumber: z.number().int(),
  strikes: z.number().int(),
  scouterReliability: z.number().int(),
  archived: z.boolean(),
});

export const SharedPicklistSchema = z.object({
  uuid: z.string().uuid(),
  name: z.string(),
  totalPoints: z.number(),
  autoPoints: z.number(),
  teleopPoints: z.number(),
  authorId: z.string(),
  autoClimb: z.number(),
  campingDefenseTime: z.number(),
  climbResult: z.number(),
  contactDefenseTime: z.number(),
  driverAbility: z.number(),
  defenseEffectiveness: z.number(),
  estimatedSuccessfulFuelRate: z.number(),
  estimatedTotalFuelScored: z.number(),
  feedingRate: z.number(),
  scoringRate: z.number(),
  totalDefensiveTime: z.number(),
  totalFuelFed: z.number(),
  totalFuelThroughput: z.number(),
});

export const TeamSchema = z.object({
  number: z.number().int(),
  name: z.string(),
});

export const RegisteredTeamSchema = z.object({
  number: z.number().int(),
  code: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  teamApproved: z.boolean(),
  website: z.string().optional().nullable(),
});

export const EmailVerificationRequestSchema = z.object({
  verificationCode: z.string(),
  email: z.string(),
  expiresAt: z.string().datetime(),
  teamNumber: z.number().int(),
});

export const SlackWorkspaceSchema = z.object({
  workspaceId: z.string(),
  owner: z.number().int(),
  name: z.string(),
  authToken: z.string(),
  botUserId: z.string(),
  authUserId: z.string(),
});

export const SlackSubscriptionSchema = z.object({
  subscriptionId: z.string(),
  channelId: z.string(),
  workspaceId: z.string(),
  subscribedEvent: WarningTypeSchema,
});

export const SlackNotificationThreadSchema = z.object({
  messageId: z.string(),
  matchNumber: z.number().int(),
  teamNumber: z.number().int(),
  subscriptionId: z.string(),
  channelId: z.string(),
});

export const TournamentSchema = z.object({
  key: z.string(),
  name: z.string(),
  location: z.string().optional().nullable(),
  date: z.string().optional().nullable(),
});

export const UserSchema = z.object({
  id: z.string(),
  teamNumber: z.number().int().optional().nullable(),
  email: z.string(),
  emailVerified: z.boolean(),
  username: z.string().optional().nullable(),
  role: UserRoleSchema,
  teamSourceRule: DataSourceRuleNumberSchema,
  tournamentSourceRule: DataSourceRuleStringSchema,
});

export const ApiKeySchema = z.object({
  uuid: z.string().uuid(),
  keyHash: z.string(),
  name: z.string(),
  userId: z.string(),
  createdAt: z.string().datetime(),
  lastUsed: z.string().datetime().optional().nullable(),
  requests: z.number().int(),
});

export const CachedAnalysisSchema = z.object({
  key: z.string(),
  teamDependencies: z.array(z.number().int()).default([]),
  tournamentDependencies: z.array(z.string()).default([]),
});

export function registerPrismaSchemas(registry: OpenAPIRegistry) {
  registry.register("Position", PositionSchema);
  registry.register("EventAction", EventActionSchema);
  registry.register("Mobility", MobilitySchema);
  registry.register("Beached", BeachedSchema);
  registry.register("EndgameClimb", EndgameClimbSchema);
  registry.register("ClimbPosition", ClimbPositionSchema);
  registry.register("ClimbSide", ClimbSideSchema);
  registry.register("AutoClimb", AutoClimbSchema);
  registry.register("FeederType", FeederTypeSchema);
  registry.register("IntakeType", IntakeTypeSchema);
  registry.register("RobotRole", RobotRoleSchema);
  registry.register("WarningType", WarningTypeSchema);
  registry.register("UserRole", UserRoleSchema);
  registry.register("MatchType", MatchTypeSchema);

  registry.register("Event", EventSchema);
  registry.register("FeatureToggle", FeatureToggleSchema);
  registry.register("TeamMatchData", TeamMatchDataSchema);
  registry.register("MutablePicklist", MutablePicklistSchema);
  registry.register("ScoutReport", ScoutReportSchema);
  registry.register("ScouterScheduleShift", ScouterScheduleShiftSchema);
  registry.register("Scouter", ScouterSchema);
  registry.register("SharedPicklist", SharedPicklistSchema);
  registry.register("Team", TeamSchema);
  registry.register("RegisteredTeam", RegisteredTeamSchema);
  registry.register("EmailVerificationRequest", EmailVerificationRequestSchema);
  registry.register("SlackWorkspace", SlackWorkspaceSchema);
  registry.register("SlackSubscription", SlackSubscriptionSchema);
  registry.register("SlackNotificationThread", SlackNotificationThreadSchema);
  registry.register("Tournament", TournamentSchema);
  registry.register("User", UserSchema);
  registry.register("ApiKey", ApiKeySchema);
  registry.register("CachedAnalysis", CachedAnalysisSchema);
}
