import { Router } from "express";
import express from "express";

import { requireSlackToken } from "@/src/lib/middleware/requireSlackToken.js";
import { addSlackWorkspace } from "@/src/handler/slack/addSlackWorkspace.js";
import { processCommand } from "@/src/handler/slack/processCommands.js";
import { processEvent } from "@/src/handler/slack/processEvents.js";

/*

slack.routes.ts

GET    /slack/add-workspace
POST   /slack/command
POST   /slack/event

*/

const router = Router();
router.use(requireSlackToken);
router.get("/add-workspace", addSlackWorkspace);

router.post("/command", express.urlencoded({ extended: true }), processCommand);

router.post("/event", processEvent);

export default router;
