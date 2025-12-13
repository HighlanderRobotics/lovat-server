import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth";
import { updateScouterName } from "../../handler/manager/updateScouterName";
import { deleteScouter } from "../../handler/manager/deleteScouter";
import { scoutingLeadProgressPage } from "../../handler/manager/scoutingLeadProgressPage";
import { addScouterDashboard } from "../../handler/manager/addScouterDashboard";
import { scouterScoutReports } from "../../handler/analysis/scoutingLead/scouterScoutReports";

const router = Router();

router.put("/scoutername", requireAuth, updateScouterName);
router.delete("/scouterdashboard", requireAuth, deleteScouter);
router.get("/scouterspage", requireAuth, scoutingLeadProgressPage);
router.post("/scouterdashboard", requireAuth, addScouterDashboard);
router.get("/scouterreports", requireAuth, scouterScoutReports);

export default router;
