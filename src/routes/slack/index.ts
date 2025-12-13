import express from "express";
import { requireSlackToken } from "../../lib/middleware/requireSlackToken";
import { processEvent } from "../../handler/slack/processEvents";
import { processCommand } from "../../handler/slack/processCommands";
import { addSlackWorkspace } from "../../handler/slack/addSlackWorkspace";

const router = express.Router();

router.use(requireSlackToken)

// add/update slack workspace
router.get("/add-workspace", addSlackWorkspace);

// process slash commands
router.post(
  "/command",
  express.urlencoded({ extended: true }),
  processCommand
);

router.post("/event", processEvent);

export default router
