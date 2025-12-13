import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth";
import { addScoutReportDashboard } from "../../handler/manager/addScoutReportDashboard";

const router = Router();

router.post("/scoutreport", requireAuth, addScoutReportDashboard);

export default router;
