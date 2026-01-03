import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth.js";
import { addNewScouter } from "../../handler/manager/scouters/addNewScouter.js";
import { archiveScouter } from "../../handler/manager/scouters/archiveScouter.js";
import { changeNameScouter } from "../../handler/manager/scouters/changeNameScouter.js";
import { checkCodeScouter } from "../../handler/manager/scouters/checkCodeScouter.js";
import { emailTeamCode } from "../../handler/manager/scouters/emailTeamCode.js";
import { getScheduleForScouter } from "../../handler/manager/scouters/getScheduleForScouter.js";
import { getScoutersOnTeam } from "../../handler/manager/scouters/getScoutersOnTeam.js";
import { getScouterTournaments } from "../../handler/manager/scouters/getScouterTournaments.js";
import { getTournamentForScouterWithSchedule } from "../../handler/manager/scouters/getTournamentForScouterWithSchedule.js";
import { unarchiveScouter } from "../../handler/manager/scouters/unarchiveScouter.js";
import { addScouterDashboard } from "../../handler/manager/scouters/addScouterDashboard.js";
import { scouterScoutReports } from "../../handler/analysis/scoutingLead/scouterScoutReports.js";
import { deleteScouter } from "../../handler/manager/scouters/deleteScouter.js";
import { scoutingLeadProgressPage } from "../../handler/manager/scouters/scoutingLeadProgressPage.js";
import { updateScouterName } from "../../handler/manager/scouters/updateScouterName.js";

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

router.post("/unarchive/uuid/:uuid", unarchiveScouter);
router.post("/archive/uuid/:uuid", archiveScouter);

router.put("/scoutername", updateScouterName);
router.delete("/scouterdashboard", deleteScouter);
router.get("/scouterspage", scoutingLeadProgressPage);
router.post("/scouterdashboard", addScouterDashboard);
router.get("/scouterreports", scouterScoutReports);

export default router;
