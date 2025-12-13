import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth";
import requireLovatSignature from "../../lib/middleware/requireLovatSignature";
import { addUsername } from "../../handler/manager/addUsername";
import { checkCode } from "../../handler/manager/checkCode";
import { addTeamSource } from "../../handler/manager/addTeamSource";
import { addTournamentSource } from "../../handler/manager/addTournamentSource";
import { addRegisteredTeam } from "../../handler/manager/addRegisteredTeam";
import { approveRegisteredTeam } from "../../handler/manager/approveRegisteredTeam";
import { rejectRegisteredTeam } from "../../handler/manager/rejectRegisteredTeam";
import { addWebsite } from "../../handler/manager/addWebsite";
import { resendEmail } from "../../handler/manager/resendEmail";
import rateLimit from "express-rate-limit";
import { approveTeamEmail } from "../../handler/manager/approveTeamEmail";

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
