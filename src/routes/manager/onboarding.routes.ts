import { Router } from "express";
import requireLovatSignature from "../../lib/middleware/requireLovatSignature";
import { approveTeamEmail } from "../../handler/manager/onboarding/approveTeamEmail";
import { addUsername } from "../../handler/manager/onboarding/addUsername";
import { checkCode } from "../../handler/manager/onboarding/checkCode";
import { requireAuth } from "../../lib/middleware/requireAuth";
import { addRegisteredTeam } from "../../handler/manager/addRegisteredTeam";
import rateLimit from "express-rate-limit";
import { addWebsite } from "../../handler/manager/onboarding/addWebsite";
import { resendEmail } from "../../handler/manager/resendEmail";

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

router.post(
  "/resendverificationemail",
  resendEmailLimiter,
  requireAuth,
  resendEmail,
);

export default router;
