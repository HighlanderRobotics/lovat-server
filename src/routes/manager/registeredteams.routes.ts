import { Router } from "express";
import { requireAuth } from "@/src/lib/middleware/requireAuth.js";
import { rejectRegisteredTeam } from "@/src/handler/manager/registeredteams/rejectRegisteredTeam.js";
import { approveRegisteredTeam } from "@/src/handler/manager/registeredteams/approveRegisteredTeam.js";
import { checkRegisteredTeam } from "@/src/handler/manager/registeredteams/checkRegisteredTeam.js";
import requireLovatSignature from "@/src/lib/middleware/requireLovatSignature.js";

const router = Router();

router.get("/:team/registrationstatus", requireAuth, checkRegisteredTeam);

router.use(requireLovatSignature);
router.post("/:team/approve", approveRegisteredTeam);
router.post("/:team/reject", rejectRegisteredTeam);

export default router;
