import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth";
import { getProfile } from "../../handler/manager/getProfile";
import { getUsers } from "../../handler/manager/getUsers";
import { deleteUser } from "../../handler/manager/deleteUser";
import { updateRoleToScoutingLead } from "../../handler/manager/updateRoleToScoutingLead";
import { scoutingLeadProgressPage } from "../../handler/manager/scoutingLeadProgressPage";
import { deleteScouter } from "../../handler/manager/deleteScouter";
import { addScouterDashboard } from "../../handler/manager/addScouterDashboard";
import { scouterScoutReports } from "../../handler/analysis/scoutingLead/scouterScoutReports";
import { updateScouterName } from "../../handler/manager/updateScouterName";
import { getTeamCode } from "../../handler/manager/getTeamCode";
import { getAnalysts } from "../../handler/manager/getAnalysts";
import { deleteScoutReport } from "../../handler/manager/deleteScoutReport";

const router = Router();

// GET /v1/manager/profile
router.get("/profile", requireAuth, getProfile);

// GET /v1/manager/users
router.get("/users", requireAuth, getUsers);

// DELETE /v1/manager/user
router.delete("/user", requireAuth, deleteUser);

// POST /v1/manager/upgradeuser
router.post("/upgradeuser", requireAuth, updateRoleToScoutingLead);


router.get("/code", requireAuth, getTeamCode);

router.get("/analysts", requireAuth, getAnalysts);

router.get("/scouterspage", requireAuth, scoutingLeadProgressPage);

router.put("/scoutername", requireAuth, updateScouterName);

router.delete("/scouterdashboard", requireAuth, deleteScouter);

router.post("/scouterdashboard", requireAuth, addScouterDashboard);

router.get("/scouterreports", requireAuth, scouterScoutReports);

router.delete("/scoutreports/:uuid", requireAuth, deleteScoutReport);

export default router;
