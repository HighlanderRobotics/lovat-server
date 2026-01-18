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

const router = Router();

router.post("/verifyemail", requireLovatSignature, approveTeamEmail);

router.use(requireAuth);

router.post("/username", addUsername);

router.post("/teamcode", checkCode);

router.post("/team", addRegisteredTeam);

router.post("/teamwebsite", addWebsite);

router.post("/resendverificationemail", resendEmailLimiter, resendEmail);

export default router;
