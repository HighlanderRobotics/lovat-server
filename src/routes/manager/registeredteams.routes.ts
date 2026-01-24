import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth.js";
import { rejectRegisteredTeam } from "../../handler/manager/registeredteams/rejectRegisteredTeam.js";
import { approveRegisteredTeam } from "../../handler/manager/registeredteams/approveRegisteredTeam.js";
import { checkRegisteredTeam } from "../../handler/manager/registeredteams/checkRegisteredTeam.js";
import requireLovatSignature from "../../lib/middleware/requireLovatSignature.js";
import { registry } from "../../lib/openapi.js";
import { z } from "zod";

const TeamParamSchema = z.object({ team: z.string() });

registry.registerPath({
  method: "get",
  path: "/v1/manager/registeredteams/{team}/registrationstatus",
  tags: ["Manager - Registered Teams"],
  summary: "Check team registration status",
  request: { params: TeamParamSchema },
  responses: { 200: { description: "Status", content: { "application/json": { schema: z.object({ status: z.string() }) } } }, 401: { description: "Unauthorized" } },
  security: [{ bearerAuth: [] }],
});
registry.registerPath({
  method: "post",
  path: "/v1/manager/registeredteams/{team}/approve",
  tags: ["Manager - Registered Teams"],
  summary: "Approve team",
  request: { params: TeamParamSchema },
  responses: { 200: { description: "Approved" }, 403: { description: "Invalid signature" } },
  security: [{ lovatSignature: [] }],
});
registry.registerPath({
  method: "post",
  path: "/v1/manager/registeredteams/{team}/reject",
  tags: ["Manager - Registered Teams"],
  summary: "Reject team",
  request: { params: TeamParamSchema },
  responses: { 200: { description: "Rejected" }, 403: { description: "Invalid signature" } },
  security: [{ lovatSignature: [] }],
});

const router = Router();

router.get("/:team/registrationstatus", requireAuth, checkRegisteredTeam);

router.use(requireLovatSignature);
router.post("/:team/approve", approveRegisteredTeam);
router.post("/:team/reject", rejectRegisteredTeam);

export default router;
