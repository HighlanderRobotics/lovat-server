import { Router } from "express";
import express from "express";

import { requireSlackToken } from "../../lib/middleware/requireSlackToken.js";
import { addSlackWorkspace } from "../../handler/slack/addSlackWorkspace.js";
import { processCommand } from "../../handler/slack/processCommands.js";
import { processEvent } from "../../handler/slack/processEvents.js";
import { registry } from "../../lib/openapi.js";
import { z } from "zod";

/*

slack.routes.ts

GET    /slack/add-workspace
POST   /slack/command
POST   /slack/event

*/

const router = Router();

registry.registerPath({
  method: "get",
  path: "/v1/slack/add-workspace",
  tags: ["Slack"],
  summary: "Add Slack workspace (OAuth flow)",
  responses: { 200: { description: "Redirect or JSON" } },
  security: [{ slackToken: [] }],
});
registry.registerPath({
  method: "post",
  path: "/v1/slack/command",
  tags: ["Slack"],
  summary: "Slack slash command",
  request: { body: { content: { "application/x-www-form-urlencoded": { schema: z.object({ command: z.string(), text: z.string().optional() }) } } } },
  responses: { 200: { description: "Processed" } },
  security: [{ slackToken: [] }],
});
registry.registerPath({
  method: "post",
  path: "/v1/slack/event",
  tags: ["Slack"],
  summary: "Slack event callback",
  request: { body: { content: { "application/json": { schema: z.object({ type: z.string(), event: z.record(z.string(), z.any()) }) } } } },
  responses: { 200: { description: "Processed" } },
  security: [{ slackToken: [] }],
});

router.use(requireSlackToken);
router.get("/add-workspace", addSlackWorkspace);

router.post("/command", express.urlencoded({ extended: true }), processCommand);

router.post("/event", processEvent);

export default router;
