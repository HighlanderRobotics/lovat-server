import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth.js";
import { addScoutReportDashboard } from "../../handler/manager/scouter/addScoutReportDashboard.js";

const router = Router();

router.post("/scoutreport", requireAuth, addScoutReportDashboard);

export default router;
