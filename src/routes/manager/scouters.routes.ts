import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth";
import { addNewScouter } from "../../handler/manager/addNewScouter";
import { archiveScouter } from "../../handler/manager/scouters/archiveScouter";
import { changeNameScouter } from "../../handler/manager/scouters/changeNameScouter";
import { checkCodeScouter } from "../../handler/manager/scouters/checkCodeScouter";
import { emailTeamCode } from "../../handler/manager/scouters/emailTeamCode";
import { getScheduleForScouter } from "../../handler/manager/scouters/getScheduleForScouter";
import { getScoutersOnTeam } from "../../handler/manager/scouters/getScoutersOnTeam";
import { getScouterTournaments } from "../../handler/manager/scouters/getScouterTournaments";
import { getTournamentForScouterWithSchedule } from "../../handler/manager/scouters/getTournamentForScouterWithSchedule";
import { unarchiveScouter } from "../../handler/manager/unarchiveScouter";
import { addScouterDashboard } from "../../handler/manager/addScouterDashboard";
import { scouterScoutReports } from "../../handler/manager/dashboard/scouterScoutReports";
import { deleteScouter } from "../../handler/manager/deleteScouter";
import { scoutingLeadProgressPage } from "../../handler/manager/scouters/scoutingLeadProgressPage";
import { updateScouterName } from "../../handler/manager/scouters/updateScouterName";

const router = Router();
router.post("/emailTeamCode", emailTeamCode);
router.get("/scouter/checkcode", checkCodeScouter);
router.post("/name/uuid/:uuid", changeNameScouter);
router.get("/scouters", getScoutersOnTeam);
router.post("/scouter", addNewScouter);

router.get("/scouters/:uuid/tournaments", getScouterTournaments);
router.get("/scouterschedules/:tournament", getScheduleForScouter);
router.get("/scouter/tournaments", getTournamentForScouterWithSchedule);

router.use(requireAuth);

router.post("/unarchive/uuid/:uuid", requireAuth, unarchiveScouter);
router.post("/archive/uuid/:uuid", requireAuth, archiveScouter);

router.put("/scoutername", updateScouterName);
router.delete("/scouterdashboard", deleteScouter);
router.get("/scouterspage", scoutingLeadProgressPage);
router.post("/scouterdashboard", addScouterDashboard);
router.get("/scouterreports", scouterScoutReports);

export default router;
