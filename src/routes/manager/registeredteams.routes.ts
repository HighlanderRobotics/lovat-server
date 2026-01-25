import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth.js";
import { rejectRegisteredTeam } from "../../handler/manager/registeredteams/rejectRegisteredTeam.js";
import { approveRegisteredTeam } from "../../handler/manager/registeredteams/approveRegisteredTeam.js";
import { checkRegisteredTeam } from "../../handler/manager/registeredteams/checkRegisteredTeam.js";
import requireLovatSignature from "../../lib/middleware/requireLovatSignature.js";
import { registry } from "../../lib/openapi.js";
import { z } from "zod";
import { RegisteredTeamSchema } from "../../lib/prisma-zod.js";

const TeamParamSchema = z.object({ team: z.string() });

// Status variants returned by checkRegisteredTeam handler
const RegistrationStatusSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("NOT_STARTED") }),
  z.object({ status: z.literal("PENDING_EMAIL_VERIFICATION"), email: z.string() }),
  z.object({ status: z.literal("PENDING_WEBSITE") }),
  z.object({ status: z.literal("PENDING_TEAM_VERIFICATION"), teamEmail: z.string() }),
  z.object({ status: z.literal("REGISTERED_ON_TEAM") }),
  z.object({ status: z.literal("REGISTERED_OFF_TEAM") }),
  z.object({ status: z.literal("PENDING") }),
]);

registry.registerPath({
  method: "get",
  path: "/v1/manager/registeredteams/{team}/registrationstatus",
  tags: ["Manager - Registered Teams"],
  summary: "Check team registration status",
  request: { params: TeamParamSchema },
  responses: {
    200: {
      description: "Registration status",
      content: { "application/json": { schema: RegistrationStatusSchema } },
    },
    400: { description: "Invalid team" },
    401: { description: "Unauthorized" },
    500: { description: "Server error" },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: "post",
  path: "/v1/manager/registeredteams/{team}/approve",
  tags: ["Manager - Registered Teams"],
  summary: "Approve team",
  description:
    "Requires `x-signature` and `x-timestamp` headers. Signs request body, method, path.",
  request: { params: TeamParamSchema },
  responses: {
    200: {
      description: "Approved registered team row",
      content: { "application/json": { schema: RegisteredTeamSchema } },
    },
    400: { description: "Invalid team" },
    401: { description: "Unauthorized or signature expired" },
    403: { description: "Invalid signature" },
    500: { description: "Server error" },
  },
  security: [{ lovatSignature: [] }],
});

registry.registerPath({
  method: "post",
  path: "/v1/manager/registeredteams/{team}/reject",
  tags: ["Manager - Registered Teams"],
  summary: "Reject team",
  description:
    "Requires `x-signature` and `x-timestamp` headers. Signs request body, method, path.",
  request: { params: TeamParamSchema },
  responses: {
    200: {
      description: "Rejection message",
      content: { "text/plain": { schema: z.string() } },
    },
    400: { description: "Invalid team" },
    401: { description: "Unauthorized or signature expired" },
    403: { description: "Invalid signature" },
    500: { description: "Server error" },
  },
  security: [{ lovatSignature: [] }],
});

const router = Router();

router.get("/:team/registrationstatus", requireAuth, checkRegisteredTeam);

router.use(requireLovatSignature);
router.post("/:team/approve", approveRegisteredTeam);
router.post("/:team/reject", rejectRegisteredTeam);

export default router;
