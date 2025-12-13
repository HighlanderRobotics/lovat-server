import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth";
import rateLimit from "express-rate-limit";
import { updateSettings } from "../../handler/manager/updateSettings";
import { getTeamSource } from "../../handler/manager/getTeamSource";
import { getTournamentSource } from "../../handler/manager/getTournamentSource";
import { updateTeamEmail } from "../../handler/manager/updateTeamEmail";

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
