import express from "express";
import { requireSlackToken } from "../../lib/middleware/requireSlackToken";
import { processEvent } from "../../handler/slack/processEvents";
import { processCommand } from "../../handler/slack/processCommands";
import { addSlackWorkspace } from "../../handler/slack/addSlackWorkspace";

const router = express.Router();

router.use(requireSlackToken)

// Router: /v1/slack
// GET /add-workspace → add or update Slack workspace
router.get("/add-workspace", addSlackWorkspace);

// POST /command → process Slack slash commands
router.post(
  "/command",
  express.urlencoded({ extended: true }),
  processCommand
);

// POST /event → process Slack events
router.post("/event", processEvent);

export default router
