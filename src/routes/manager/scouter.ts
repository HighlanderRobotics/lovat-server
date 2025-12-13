import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth";
import { getScouters } from "../../handler/manager/getScouters";
import { getScouterSchedule } from "../../handler/manager/getScouterSchedule";
import { getScoutersOnTeam } from "../../handler/manager/getScoutersOnTeam";
import { addNewScouter } from "../../handler/manager/addNewScouter";
import { emailTeamCode } from "../../handler/manager/emailTeamCode";
import { checkCodeScouter } from "../../handler/manager/checkCodeScouter";
import { unarchiveScouter } from "../../handler/manager/unarchiveScouter";
import { archiveScouter } from "../../handler/manager/archiveScouter";
import { changeNameScouter } from "../../handler/manager/changeNameScouter";
import { getScouterTournaments } from "../../handler/manager/getScouterTournaments";
import { getScheduleForScouter } from "../../handler/manager/getScheduleForScouter";
import { getTournamentForScouterWithSchedule } from "../../handler/manager/getTournamentForScouterWithSchedule";

const router = Router();

router.get("/shift/scouters", requireAuth, getScouters);
router.get("/shift", requireAuth, getScouterSchedule);
router.get("/scouters", getScoutersOnTeam);
router.post("/scouter", addNewScouter);
router.post("/emailTeamCode", emailTeamCode);
router.get("/checkcode", checkCodeScouter);
router.post("/unarchive/uuid/:uuid", requireAuth, unarchiveScouter);
router.post("/archive/uuid/:uuid", requireAuth, archiveScouter);
router.post("/name/uuid/:uuid", changeNameScouter);
router.get("/scouters/:uuid/tournaments", getScouterTournaments);
router.get("/scouterschedules/:tournament", getScheduleForScouter);
router.get("/tournaments", getTournamentForScouterWithSchedule);

export default router;
