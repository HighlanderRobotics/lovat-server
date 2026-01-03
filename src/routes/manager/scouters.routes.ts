import { Router } from "express";
import { requireAuth } from "@/src/lib/middleware/requireAuth.js";
import { addNewScouter } from "@/src/handler/manager/scouters/addNewScouter.js";
import { archiveScouter } from "@/src/handler/manager/scouters/archiveScouter.js";
import { changeNameScouter } from "@/src/handler/manager/scouters/changeNameScouter.js";
import { checkCodeScouter } from "@/src/handler/manager/scouters/checkCodeScouter.js";
import { emailTeamCode } from "@/src/handler/manager/scouters/emailTeamCode.js";
import { getScheduleForScouter } from "@/src/handler/manager/scouters/getScheduleForScouter.js";
import { getScoutersOnTeam } from "@/src/handler/manager/scouters/getScoutersOnTeam.js";
import { getScouterTournaments } from "@/src/handler/manager/scouters/getScouterTournaments.js";
import { getTournamentForScouterWithSchedule } from "@/src/handler/manager/scouters/getTournamentForScouterWithSchedule.js";
import { unarchiveScouter } from "@/src/handler/manager/scouters/unarchiveScouter.js";
import { addScouterDashboard } from "@/src/handler/manager/scouters/addScouterDashboard.js";
import { scouterScoutReports } from "@/src/handler/analysis/scoutingLead/scouterScoutReports.js";
import { deleteScouter } from "@/src/handler/manager/scouters/deleteScouter.js";
import { scoutingLeadProgressPage } from "@/src/handler/manager/scouters/scoutingLeadProgressPage.js";
import { updateScouterName } from "@/src/handler/manager/scouters/updateScouterName.js";

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
