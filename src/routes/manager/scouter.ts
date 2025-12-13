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

// Router: /v1/manager/scouter
// GET /shift/scouters → list scouters
router.get("/shift/scouters", requireAuth, getScouters);
// GET /shift → scouter schedule
router.get("/shift", requireAuth, getScouterSchedule);
// GET /scouters → scouters on team
router.get("/scouters", getScoutersOnTeam);
// POST /scouter → add scouter
router.post("/scouter", addNewScouter);
// POST /emailTeamCode → send code
router.post("/emailTeamCode", emailTeamCode);
// GET /checkcode → verify code
router.get("/checkcode", checkCodeScouter);
// POST /unarchive/uuid/:uuid → unarchive
router.post("/unarchive/uuid/:uuid", requireAuth, unarchiveScouter);
// POST /archive/uuid/:uuid → archive
router.post("/archive/uuid/:uuid", requireAuth, archiveScouter);
// POST /name/uuid/:uuid → change name
router.post("/name/uuid/:uuid", changeNameScouter);
// GET /scouters/:uuid/tournaments → list tournaments
router.get("/scouters/:uuid/tournaments", getScouterTournaments);
// GET /scouterschedules/:tournament → schedule
router.get("/scouterschedules/:tournament", getScheduleForScouter);
// GET /tournaments → scouter tournaments
router.get("/tournaments", getTournamentForScouterWithSchedule);

export default router;
