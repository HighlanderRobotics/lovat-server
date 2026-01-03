import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth.js";
import { rejectRegisteredTeam } from "../../handler/manager/registeredteams/rejectRegisteredTeam.js";
import { approveRegisteredTeam } from "../../handler/manager/registeredteams/approveRegisteredTeam.js";
import { checkRegisteredTeam } from "../../handler/manager/registeredteams/checkRegisteredTeam.js";
import requireLovatSignature from "../../lib/middleware/requireLovatSignature.js";

const router = Router();

router.get("/:team/registrationstatus", requireAuth, checkRegisteredTeam);

router.use(requireLovatSignature);
router.post("/:team/approve", approveRegisteredTeam);
router.post("/:team/reject", rejectRegisteredTeam);

export default router;
