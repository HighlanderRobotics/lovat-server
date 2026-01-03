import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth";
import { rejectRegisteredTeam } from "../../handler/manager/rejectRegisteredTeam";
import { approveRegisteredTeam } from "../../handler/manager/approveRegisteredTeam";
import { checkRegisteredTeam } from "../../handler/manager/checkRegisteredTeam";
import requireLovatSignature from "../../lib/middleware/requireLovatSignature";

const router = Router();

router.get("/:team/registrationstatus", requireAuth, checkRegisteredTeam);

router.use(requireLovatSignature);
router.post("/:team/approve", approveRegisteredTeam);
router.post("/:team/reject", rejectRegisteredTeam);

export default router;
