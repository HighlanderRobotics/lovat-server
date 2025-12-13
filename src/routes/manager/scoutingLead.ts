import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth";
import { updateScouterName } from "../../handler/manager/dashboard/updateScouterName";
import { deleteScouter } from "../../handler/manager/dashboard/deleteScouter";
import { scoutingLeadProgressPage } from "../../handler/manager/dashboard/scoutingLeadProgressPage";
import { addScouterDashboard } from "../../handler/manager/dashboard/addScouterDashboard";
import { scouterScoutReports } from "../../handler/manager/dashboard/scouterScoutReports";

const router = Router();

router.put("/scoutername", requireAuth, updateScouterName);
router.delete("/scouterdashboard", requireAuth, deleteScouter);
router.get("/scouterspage", requireAuth, scoutingLeadProgressPage);
router.post("/scouterdashboard", requireAuth, addScouterDashboard);
router.get("/scouterreports", requireAuth, scouterScoutReports);

export default router;
