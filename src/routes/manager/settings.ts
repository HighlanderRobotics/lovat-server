import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth.js";
import rateLimit from "express-rate-limit";
import { updateSettings } from "../../handler/manager/settings/updateSettings.js";
import { getTeamSource } from "../../handler/manager/teams/getTeamSource.js";
import { getTournamentSource } from "../../handler/manager/tournaments/getTournamentSource.js";
import { updateTeamEmail } from "../../handler/manager/settings/updateTeamEmail.js";

const updateTeamEmails = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: 3,
  message:
    "Too many email updates sent from this IP, please try again after 2 minutes",
  validate: { trustProxy: false },
});

const router = Router();

router.put("/", requireAuth, updateSettings);
router.get("/teamsource", requireAuth, getTeamSource);
router.get("/tournamentsource", requireAuth, getTournamentSource);
router.put("/teamemail", updateTeamEmails, requireAuth, updateTeamEmail);

export default router;
