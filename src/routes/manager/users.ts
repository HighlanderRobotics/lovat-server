import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth";
import { getProfile } from "../../handler/manager/users/getProfile";
import { getUsers } from "../../handler/manager/users/getUsers";
import { deleteUser } from "../../handler/manager/users/deleteUser";
import { updateRoleToScoutingLead } from "../../handler/manager/users/updateRoleToScoutingLead";
import { scoutingLeadProgressPage } from "../../handler/manager/dashboard/scoutingLeadProgressPage";
import { deleteScouter } from "../../handler/manager/dashboard/deleteScouter";
import { addScouterDashboard } from "../../handler/manager/dashboard/addScouterDashboard";
import { scouterScoutReports } from "../../handler/manager/dashboard/scouterScoutReports";
import { updateScouterName } from "../../handler/manager/dashboard/updateScouterName";
import { getTeamCode } from "../../handler/manager/onboarding/getTeamCode";
import { getAnalysts } from "../../handler/manager/users/getAnalysts";
import { deleteScoutReport } from "../../handler/manager/dashboard/deleteScoutReport";

const router = Router();

// Router: /v1/manager/* (mounted at root)
// GET /profile → current user profile
router.get("/profile", requireAuth, getProfile);

// GET /users → team users
router.get("/users", requireAuth, getUsers);

// DELETE /user → delete a user
router.delete("/user", requireAuth, deleteUser);

// POST /upgradeuser → promote to scouting lead
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
