import { Router } from "express";
import requireLovatSignature from "../../lib/middleware/requireLovatSignature.js";
import { approveTeamEmail } from "../../handler/manager/onboarding/approveTeamEmail.js";
import { addUsername } from "../../handler/manager/onboarding/addUsername.js";
import { checkCode } from "../../handler/manager/onboarding/checkCode.js";
import { requireAuth } from "../../lib/middleware/requireAuth.js";
import { addRegisteredTeam } from "../../handler/manager/registeredteams/addRegisteredTeam.js";
import rateLimit from "express-rate-limit";
import { addWebsite } from "../../handler/manager/onboarding/addWebsite.js";
import { resendEmail } from "../../handler/manager/onboarding/resendEmail.js";
import { registry } from "../../lib/openapi.js";
import { z } from "zod";

/*

onboarding.routes.ts

POST   /manager/onboarding/verifyemail
POST   /manager/onboarding/username
POST   /manager/onboarding/teamcode
POST   /manager/onboarding/team
POST   /manager/onboarding/teamwebsite
POST   /manager/onboarding/resendverificationemail

*/

const resendEmailLimiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: 2,
  message:
    "Too many emails sent from this IP, please try again after 2 minutes",
  validate: { trustProxy: false },
});

registry.registerPath({
  method: "post",
  path: "/v1/manager/onboarding/verifyemail",
  tags: ["Manager - Onboarding"],
  summary: "Approve team email (signed)",
  request: { body: { content: { "application/json": { schema: z.object({ token: z.string() }) } } } },
  responses: { 200: { description: "Approved" }, 400: { description: "Invalid" }, 403: { description: "Invalid signature" } },
  security: [{ lovatSignature: [] }],
});
registry.registerPath({
  method: "post",
  path: "/v1/manager/onboarding/username",
  tags: ["Manager - Onboarding"],
  summary: "Set username",
  request: { body: { content: { "application/json": { schema: z.object({ username: z.string() }) } } } },
  responses: { 200: { description: "Updated" }, 400: { description: "Invalid" }, 401: { description: "Unauthorized" } },
  security: [{ bearerAuth: [] }],
});
registry.registerPath({
  method: "post",
  path: "/v1/manager/onboarding/teamcode",
  tags: ["Manager - Onboarding"],
  summary: "Check team code",
  request: { body: { content: { "application/json": { schema: z.object({ code: z.string() }) } } } },
  responses: { 200: { description: "Valid" }, 400: { description: "Invalid" }, 401: { description: "Unauthorized" } },
  security: [{ bearerAuth: [] }],
});
registry.registerPath({
  method: "post",
  path: "/v1/manager/onboarding/team",
  tags: ["Manager - Onboarding"],
  summary: "Add registered team",
  request: { body: { content: { "application/json": { schema: z.object({ number: z.number().int(), name: z.string().optional() }) } } } },
  responses: { 200: { description: "Added" }, 400: { description: "Invalid" }, 401: { description: "Unauthorized" } },
  security: [{ bearerAuth: [] }],
});
registry.registerPath({
  method: "post",
  path: "/v1/manager/onboarding/teamwebsite",
  tags: ["Manager - Onboarding"],
  summary: "Add team website",
  request: { body: { content: { "application/json": { schema: z.object({ url: z.string().url() }) } } } },
  responses: { 200: { description: "Added" }, 400: { description: "Invalid" }, 401: { description: "Unauthorized" } },
  security: [{ bearerAuth: [] }],
});
registry.registerPath({
  method: "post",
  path: "/v1/manager/onboarding/resendverificationemail",
  tags: ["Manager - Onboarding"],
  summary: "Resend verification email",
  responses: { 200: { description: "Sent" }, 401: { description: "Unauthorized" }, 429: { description: "Rate limited" } },
  security: [{ bearerAuth: [] }],
});

const router = Router();

router.post("/verifyemail", requireLovatSignature, approveTeamEmail);

router.use(requireAuth);

router.post("/username", addUsername);

router.post("/teamcode", checkCode);

router.post("/team", addRegisteredTeam);

router.post("/teamwebsite", addWebsite);

router.post("/resendverificationemail", resendEmailLimiter, resendEmail);

export default router;
