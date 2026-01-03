import { Router } from "express";
import { requireAuth } from "@/src/lib/middleware/requireAuth.js";
import { updateSettings } from "@/src/handler/manager/settings/updateSettings.js";
import rateLimit from "express-rate-limit";
import { updateTeamEmail } from "@/src/handler/manager/settings/updateTeamEmail.js";
import { getTeamSource } from "@/src/handler/manager/settings/getTeamSource.js";
import { addTeamSource } from "@/src/handler/manager/settings/addTeamSource.js";
import { getTournamentSource } from "@/src/handler/manager/settings/getTournamentSource.js";
import { addTournamentSource } from "@/src/handler/manager/settings/addTournamentSource.js";

const updateTeamEmails = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: 3,
  message:
    "Too many email updates sent from this IP, please try again after 2 minutes",
  validate: { trustProxy: false },
});

const router = Router();

router.use(requireAuth);

router.put("/", updateSettings);

router.get("/teamsource", getTeamSource);
router.post("/teamsource", addTeamSource);

router.get("/tournamentsource", getTournamentSource);
router.post("/tournamentsource", addTournamentSource);

router.put("/teamemail", updateTeamEmails, updateTeamEmail);

export default router;
