import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth.js";
import requireLovatSignature from "../../lib/middleware/requireLovatSignature.js";
import { addUsername } from "../../handler/manager/users/addUsername.js";
import { checkCode } from "../../handler/manager/users/checkCode.js";
import { addTeamSource } from "../../handler/manager/teams/addTeamSource.js";
import { addTournamentSource } from "../../handler/manager/tournaments/addTournamentSource.js";
import { addRegisteredTeam } from "../../handler/manager/onboarding/addRegisteredTeam.js";
import { approveRegisteredTeam } from "../../handler/manager/onboarding/approveRegisteredTeam.js";
import { rejectRegisteredTeam } from "../../handler/manager/onboarding/rejectRegisteredTeam.js";
import { addWebsite } from "../../handler/manager/onboarding/addWebsite.js";
import { resendEmail } from "../../handler/manager/onboarding/resendEmail.js";
import rateLimit from "express-rate-limit";
import { approveTeamEmail } from "../../handler/manager/onboarding/approveTeamEmail";

const resendEmailLimiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: 2,
  message:
    "Too many emails sent from this IP, please try again after 2 minutes",
  validate: { trustProxy: false },
});

const router = Router();

router.post("/username", requireAuth, addUsername);
router.post("/teamcode", requireAuth, checkCode);
router.post("/team", requireAuth, addRegisteredTeam);
router.post("/teamwebsite", requireAuth, addWebsite);
router.post("/resendverificationemail", resendEmailLimiter, requireAuth, resendEmail);
router.post("/verifyemail", requireLovatSignature, approveTeamEmail);
router.post("/registeredteams/:team/approve", requireLovatSignature, approveRegisteredTeam);
router.post("/registeredteams/:team/reject", requireLovatSignature, rejectRegisteredTeam);
router.post("/settings/teamsource", requireAuth, addTeamSource);
router.post("/settings/tournamentsource", requireAuth, addTournamentSource);

export default router;
